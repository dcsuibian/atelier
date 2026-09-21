package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.IntegrationTests;
import com.dcsuibian.atelier.constant.UserConstants;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static com.dcsuibian.atelier.jooq.generated.Tables.PERMISSION;
import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE;
import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE_PERMISSION;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER_ROLE;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

/**
 * 用户的角色分配，以及可用权限的计算与缓存失效
 */
public class UserRbacTests extends IntegrationTests {

	private static final String PREFIX = "rb_";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	DSLContext dsl;

	@AfterEach
	void tearDown() {
		dsl.deleteFrom(USER_ROLE)
				.where(USER_ROLE.USER_ID.in(dsl.select(USER.ID).from(USER).where(USER.NAME.startsWith(PREFIX))))
				.execute();
		dsl.deleteFrom(USER).where(USER.NAME.startsWith(PREFIX)).execute();
		dsl.deleteFrom(ROLE_PERMISSION)
				.where(ROLE_PERMISSION.ROLE_ID.in(dsl.select(ROLE.ID).from(ROLE).where(ROLE.NAME.startsWith(PREFIX))))
				.execute();
		dsl.deleteFrom(ROLE).where(ROLE.NAME.startsWith(PREFIX)).execute();
	}

	private long insertUser(String name) {
		return dsl.insertInto(USER, USER.NAME, USER.PASSWORD, USER.REAL_NAME, USER.GENDER, USER.STATUS)
				.values(PREFIX + name, "x", "测试用户", "UNKNOWN", "ENABLED")
				.returning(USER.ID).fetchOne(USER.ID);
	}

	/**
	 * 直接写库造一个带权限的角色，不经过接口，因此也不会触发缓存失效
	 */
	private long insertRole(String name, String... permissionCodes) {
		long roleId = dsl.insertInto(ROLE, ROLE.NAME, ROLE.DESCRIPTION, ROLE.STATUS)
				.values(PREFIX + name, "", "ENABLED")
				.returning(ROLE.ID).fetchOne(ROLE.ID);
		for (String code : permissionCodes) {
			dsl.insertInto(ROLE_PERMISSION, ROLE_PERMISSION.ROLE_ID, ROLE_PERMISSION.PERMISSION_ID)
					.select(dsl.select(DSL.val(roleId), PERMISSION.ID).from(PERMISSION).where(PERMISSION.CODE.eq(code)))
					.execute();
		}
		return roleId;
	}

	private void setRoles(long userId, long... roleIds) throws Exception {
		StringBuilder body = new StringBuilder("[");
		for (int i = 0; i < roleIds.length; i++) {
			body.append(0 == i ? "" : ",").append("{\"id\":").append(roleIds[i]).append("}");
		}
		mockMvc.perform(put("/users/" + userId + "/roles").contentType(MediaType.APPLICATION_JSON).content(body.append("]").toString()))
				.andExpect(jsonPath("$.code").value(200));
	}

	@Test
	@DisplayName("设置用户角色：整体替换；用户或角色不存在返回 404")
	void setRoles() throws Exception {
		long userId = insertUser("set");
		long a = insertRole("a");
		long b = insertRole("b");

		setRoles(userId, a, b);
		mockMvc.perform(get("/users/" + userId + "/roles"))
				.andExpect(jsonPath("$.result", hasSize(2)))
				.andExpect(jsonPath("$.result[0].id").value(a));
		setRoles(userId, b);
		mockMvc.perform(get("/users/" + userId + "/roles"))
				.andExpect(jsonPath("$.result", hasSize(1)))
				.andExpect(jsonPath("$.result[0].id").value(b));

		mockMvc.perform(put("/users/" + userId + "/roles").contentType(MediaType.APPLICATION_JSON)
						.content("[{\"id\":" + Long.MAX_VALUE + "}]"))
				.andExpect(jsonPath("$.code").value(404));
		mockMvc.perform(get("/users/" + Long.MAX_VALUE + "/roles"))
				.andExpect(jsonPath("$.code").value(404));
	}

	@Test
	@DisplayName("可用权限：多个角色的权限取并集；分配角色后立即生效，不受缓存影响")
	void availablePermissions() throws Exception {
		long userId = insertUser("avail");
		long viewer = insertRole("viewer", "user:view", "role:view");
		long editor = insertRole("editor", "user:view", "user:edit");

		// 先查一次，把「没有任何权限」写进缓存
		mockMvc.perform(get("/users/" + userId + "/available-permissions"))
				.andExpect(jsonPath("$.result", hasSize(0)));

		setRoles(userId, viewer, editor);
		mockMvc.perform(get("/users/" + userId + "/available-permissions"))
				.andExpect(jsonPath("$.result[*].code", containsInAnyOrder("user:view", "role:view", "user:edit")));
	}

	@Test
	@DisplayName("可用权限：停用角色后立即失去它提供的权限")
	void disabledRole() throws Exception {
		long userId = insertUser("role_off");
		long roleId = insertRole("off", "user:view");
		setRoles(userId, roleId);
		mockMvc.perform(get("/users/" + userId + "/available-permissions"))
				.andExpect(jsonPath("$.result", hasSize(1)));

		mockMvc.perform(patch("/roles/" + roleId).contentType(MediaType.APPLICATION_JSON).content("""
						{"status": "DISABLED"}
						"""))
				.andExpect(jsonPath("$.code").value(200));
		mockMvc.perform(get("/users/" + userId + "/available-permissions"))
				.andExpect(jsonPath("$.result", hasSize(0)));
	}

	@Test
	@DisplayName("可用权限：角色的权限变化后立即生效")
	void rolePermissionsChanged() throws Exception {
		long userId = insertUser("role_chg");
		long roleId = insertRole("chg", "user:view");
		setRoles(userId, roleId);
		mockMvc.perform(get("/users/" + userId + "/available-permissions"))
				.andExpect(jsonPath("$.result[*].code", containsInAnyOrder("user:view")));

		long roleView = dsl.select(PERMISSION.ID).from(PERMISSION).where(PERMISSION.CODE.eq("role:view")).fetchOne(PERMISSION.ID);
		mockMvc.perform(put("/roles/" + roleId + "/permissions").contentType(MediaType.APPLICATION_JSON)
						.content("[{\"id\":" + roleView + "}]"))
				.andExpect(jsonPath("$.code").value(200));
		mockMvc.perform(get("/users/" + userId + "/available-permissions"))
				.andExpect(jsonPath("$.result[*].code", containsInAnyOrder("role:view")));
	}

	@Test
	@DisplayName("可用权限：禁用用户后为空")
	void disabledUser() throws Exception {
		long userId = insertUser("user_off");
		setRoles(userId, insertRole("user_off", "user:view"));
		mockMvc.perform(get("/users/" + userId + "/available-permissions"))
				.andExpect(jsonPath("$.result", hasSize(1)));

		mockMvc.perform(patch("/users/" + userId).contentType(MediaType.APPLICATION_JSON).content("""
						{"status": "DISABLED"}
						"""))
				.andExpect(jsonPath("$.code").value(200));
		mockMvc.perform(get("/users/" + userId + "/available-permissions"))
				.andExpect(jsonPath("$.result", hasSize(0)));
	}

	@Test
	@DisplayName("可用权限：超级管理员不走角色，拥有全部启用的权限；用户不存在返回 404")
	void superAdmin() throws Exception {
		int enabled = dsl.fetchCount(PERMISSION, PERMISSION.STATUS.eq("ENABLED"));
		mockMvc.perform(get("/users/" + UserConstants.SUPER_ADMIN_ID + "/available-permissions"))
				.andExpect(jsonPath("$.result", hasSize(enabled)));
		mockMvc.perform(get("/users/" + Long.MAX_VALUE + "/available-permissions"))
				.andExpect(jsonPath("$.code").value(404));
	}

}
