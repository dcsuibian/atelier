package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.IntegrationTests;
import org.jooq.DSLContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

import static com.dcsuibian.atelier.jooq.generated.Tables.PERMISSION;
import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE;
import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE_PERMISSION;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER_ROLE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

public class RoleControllerTests extends IntegrationTests {

	private static final String PREFIX = "rt_";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JsonMapper jsonMapper;

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

	private long addRole(String name) throws Exception {
		String response = mockMvc.perform(post("/roles").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "%s", "description": "测试角色"}
						""".formatted(name)))
				.andExpect(jsonPath("$.code").value(200))
				.andReturn().getResponse().getContentAsString();
		return jsonMapper.readTree(response).path("result").path("id").asLong();
	}

	private long permissionId(String code) {
		return dsl.select(PERMISSION.ID).from(PERMISSION).where(PERMISSION.CODE.eq(code)).fetchOne(PERMISSION.ID);
	}

	@Test
	@DisplayName("新增角色：默认启用；名称重复返回 409")
	void add() throws Exception {
		mockMvc.perform(post("/roles").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "rt_add", "description": "测试角色"}
						"""))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.status").value("ENABLED"))
				.andExpect(jsonPath("$.result.createTime").isNumber());
		mockMvc.perform(post("/roles").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "rt_add", "description": "重名"}
						"""))
				.andExpect(jsonPath("$.code").value(409));
		mockMvc.perform(post("/roles").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "rt_nodesc"}
						"""))
				.andExpect(jsonPath("$.code").value(400));
	}

	@Test
	@DisplayName("分页查询：按搜索文本和状态筛选")
	void getPaged() throws Exception {
		addRole("rt_list_a");
		long disabled = addRole("rt_list_b");
		mockMvc.perform(patch("/roles/" + disabled).contentType(MediaType.APPLICATION_JSON).content("""
						{"status": "DISABLED"}
						"""))
				.andExpect(jsonPath("$.code").value(200));

		mockMvc.perform(get("/roles").param("searchText", "RT_LIST").param("pageNumber", "1").param("pageSize", "10"))
				.andExpect(jsonPath("$.result.total").value(2));
		mockMvc.perform(get("/roles").param("searchText", "rt_list").param("status", "DISABLED")
						.param("pageNumber", "1").param("pageSize", "10"))
				.andExpect(jsonPath("$.result.total").value(1))
				.andExpect(jsonPath("$.result.data[0].id").value(disabled));
	}

	@Test
	@DisplayName("按 id 查询与部分更新，不存在返回 404")
	void getByIdAndEdit() throws Exception {
		long id = addRole("rt_edit");

		mockMvc.perform(patch("/roles/" + id).contentType(MediaType.APPLICATION_JSON).content("""
						{"description": "改过的描述"}
						"""))
				.andExpect(jsonPath("$.result.name").value("rt_edit"))
				.andExpect(jsonPath("$.result.description").value("改过的描述"));
		mockMvc.perform(get("/roles/" + id))
				.andExpect(jsonPath("$.result.description").value("改过的描述"));
		mockMvc.perform(get("/roles/" + Long.MAX_VALUE))
				.andExpect(jsonPath("$.code").value(404));
		mockMvc.perform(patch("/roles/" + Long.MAX_VALUE).contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(jsonPath("$.code").value(404));
	}

	@Test
	@DisplayName("设置角色权限：整体替换，按 id 升序返回")
	void setPermissions() throws Exception {
		long id = addRole("rt_perm");
		long view = permissionId("user:view");
		long add = permissionId("user:add");
		long edit = permissionId("user:edit");

		mockMvc.perform(put("/roles/" + id + "/permissions").contentType(MediaType.APPLICATION_JSON)
						.content(jsonMapper.writeValueAsString(List.of(new Id(add), new Id(view), new Id(view)))))
				.andExpect(jsonPath("$.code").value(200));
		mockMvc.perform(get("/roles/" + id + "/permissions"))
				.andExpect(jsonPath("$.result", hasSize(2)))
				.andExpect(jsonPath("$.result[0].code").value("user:view"))
				.andExpect(jsonPath("$.result[1].code").value("user:add"));

		mockMvc.perform(put("/roles/" + id + "/permissions").contentType(MediaType.APPLICATION_JSON)
						.content(jsonMapper.writeValueAsString(List.of(new Id(edit)))))
				.andExpect(jsonPath("$.code").value(200));
		mockMvc.perform(get("/roles/" + id + "/permissions"))
				.andExpect(jsonPath("$.result", hasSize(1)))
				.andExpect(jsonPath("$.result[0].code").value("user:edit"));
	}

	@Test
	@DisplayName("设置角色权限：权限或角色不存在返回 404，id 为空返回 400")
	void setPermissionsInvalid() throws Exception {
		long id = addRole("rt_perm_bad");

		mockMvc.perform(put("/roles/" + id + "/permissions").contentType(MediaType.APPLICATION_JSON)
						.content(jsonMapper.writeValueAsString(List.of(new Id(Long.MAX_VALUE)))))
				.andExpect(jsonPath("$.code").value(404));
		mockMvc.perform(put("/roles/" + Long.MAX_VALUE + "/permissions").contentType(MediaType.APPLICATION_JSON)
						.content("[]"))
				.andExpect(jsonPath("$.code").value(404));
		mockMvc.perform(put("/roles/" + id + "/permissions").contentType(MediaType.APPLICATION_JSON)
						.content("[{\"id\": null}]"))
				.andExpect(jsonPath("$.code").value(400));
	}

	@Test
	@DisplayName("删除角色：权限分配随之删除；仍分配给用户时返回 409；不存在返回 404")
	void deleteById() throws Exception {
		long free = addRole("rt_del_free");
		dsl.insertInto(ROLE_PERMISSION, ROLE_PERMISSION.ROLE_ID, ROLE_PERMISSION.PERMISSION_ID)
				.values(free, permissionId("user:view")).execute();
		mockMvc.perform(delete("/roles/" + free))
				.andExpect(jsonPath("$.code").value(200));
		assertThat(dsl.fetchExists(ROLE_PERMISSION, ROLE_PERMISSION.ROLE_ID.eq(free))).isFalse();
		mockMvc.perform(delete("/roles/" + free))
				.andExpect(jsonPath("$.code").value(404));

		long used = addRole("rt_del_used");
		long userId = dsl.insertInto(USER, USER.NAME, USER.PASSWORD, USER.REAL_NAME, USER.GENDER, USER.STATUS)
				.values(PREFIX + "user", "x", "测试用户", "UNKNOWN", "ENABLED")
				.returning(USER.ID).fetchOne(USER.ID);
		dsl.insertInto(USER_ROLE, USER_ROLE.USER_ID, USER_ROLE.ROLE_ID).values(userId, used).execute();
		mockMvc.perform(delete("/roles/" + used))
				.andExpect(jsonPath("$.code").value(409));
	}

	record Id(long id) {
	}

}
