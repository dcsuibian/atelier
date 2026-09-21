package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.IntegrationTests;
import org.jooq.DSLContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER_ROLE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class UserControllerTests extends IntegrationTests {

	/**
	 * 测试数据统一带这个前缀，便于清理。用户名最长 16 个字符，前缀要短
	 */
	private static final String PREFIX = "ut_";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JsonMapper jsonMapper;

	@Autowired
	DSLContext dsl;

	@Autowired
	PasswordEncoder passwordEncoder;

	@AfterEach
	void tearDown() {
		dsl.deleteFrom(USER_ROLE)
				.where(USER_ROLE.USER_ID.in(dsl.select(USER.ID).from(USER).where(USER.NAME.startsWith(PREFIX))))
				.execute();
		dsl.deleteFrom(USER).where(USER.NAME.startsWith(PREFIX)).execute();
		dsl.deleteFrom(ROLE).where(ROLE.NAME.startsWith(PREFIX)).execute();
	}

	private long addUser(String name, String email) throws Exception {
		String body = """
				{"name": "%s", "password": "password123", "realName": "测试用户", "gender": "UNKNOWN", "email": %s}
				""".formatted(name, null == email ? "null" : "\"" + email + "\"");
		String response = mockMvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(jsonPath("$.code").value(200))
				.andReturn().getResponse().getContentAsString();
		return jsonMapper.readTree(response).path("result").path("id").asLong();
	}

	@Test
	@DisplayName("新增用户：默认启用，响应不带密码，库里存的是 BCrypt 哈希")
	void add() throws Exception {
		String body = """
				{"name": "ut_add", "password": "password123", "realName": "张三", "gender": "MALE", "email": "ut_add@example.com"}
				""";
		String response = mockMvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.id").isNumber())
				.andExpect(jsonPath("$.result.status").value("ENABLED"))
				.andExpect(jsonPath("$.result.gender").value("MALE"))
				.andExpect(jsonPath("$.result.createTime").isNumber())
				.andExpect(jsonPath("$.result.password").doesNotExist())
				.andReturn().getResponse().getContentAsString();

		long id = jsonMapper.readTree(response).path("result").path("id").asLong();
		String stored = dsl.select(USER.PASSWORD).from(USER).where(USER.ID.eq(id)).fetchOne(USER.PASSWORD);
		assertThat(passwordEncoder.matches("password123", stored)).isTrue();
	}

	@Test
	@DisplayName("新增用户：不能指定 id，缺必填字段返回 400")
	void addValidation() throws Exception {
		mockMvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content("""
						{"id": 1, "name": "ut_v", "password": "password123", "realName": "张三", "gender": "MALE"}
						"""))
				.andExpect(jsonPath("$.code").value(400));
		mockMvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "ut_v", "password": "password123"}
						"""))
				.andExpect(jsonPath("$.code").value(400));
	}

	@Test
	@DisplayName("新增用户：枚举取值不存在返回 400")
	void addWithUnknownGender() throws Exception {
		mockMvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "ut_g", "password": "password123", "realName": "张三", "gender": "男"}
						"""))
				.andExpect(jsonPath("$.code").value(400));
	}

	@Test
	@DisplayName("新增用户：密码超过 BCrypt 的 72 字节上限返回 400，而不是 500")
	void addWithTooLongPassword() throws Exception {
		// 30 个汉字 = 90 字节，字符数没超 72，字节数超了
		String password = "密".repeat(30);
		mockMvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "ut_pw", "password": "%s", "realName": "张三", "gender": "MALE"}
						""".formatted(password)))
				.andExpect(jsonPath("$.code").value(400));
	}

	@Test
	@DisplayName("用户名、邮箱不区分大小写，重复返回 409")
	void addConflict() throws Exception {
		addUser("ut_dup", "ut_dup@example.com");

		mockMvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "UT_DUP", "password": "password123", "realName": "张三", "gender": "MALE"}
						"""))
				.andExpect(jsonPath("$.code").value(409))
				.andExpect(jsonPath("$.message").value("用户名已存在"));
		mockMvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "ut_dup2", "password": "password123", "realName": "张三", "gender": "MALE", "email": "UT_DUP@example.com"}
						"""))
				.andExpect(jsonPath("$.code").value(409))
				.andExpect(jsonPath("$.message").value("邮箱已被使用"));
	}

	@Test
	@DisplayName("分页查询：按搜索文本和状态筛选，按 id 升序")
	void getPaged() throws Exception {
		long first = addUser("ut_list_a", null);
		addUser("ut_list_b", null);
		long disabled = addUser("ut_list_c", null);
		mockMvc.perform(patch("/users/" + disabled).contentType(MediaType.APPLICATION_JSON).content("""
						{"status": "DISABLED"}
						"""))
				.andExpect(jsonPath("$.code").value(200));

		mockMvc.perform(get("/users").param("searchText", "ut_list").param("pageNumber", "1").param("pageSize", "2"))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.total").value(3))
				.andExpect(jsonPath("$.result.pageNumber").value(1))
				.andExpect(jsonPath("$.result.pageSize").value(2))
				.andExpect(jsonPath("$.result.data", hasSize(2)))
				.andExpect(jsonPath("$.result.data[0].id").value(first))
				.andExpect(jsonPath("$.result.data[0].password").doesNotExist());

		mockMvc.perform(get("/users").param("searchText", "UT_LIST").param("status", "DISABLED")
						.param("pageNumber", "1").param("pageSize", "10"))
				.andExpect(jsonPath("$.result.total").value(1))
				.andExpect(jsonPath("$.result.data[0].id").value(disabled));
	}

	@Test
	@DisplayName("分页查询：搜索文本里的 % 和 _ 按字面匹配，不当通配符")
	void getEscapesWildcards() throws Exception {
		addUser("ut_wild", null);

		mockMvc.perform(get("/users").param("searchText", "%").param("pageNumber", "1").param("pageSize", "10"))
				.andExpect(jsonPath("$.result.total").value(0));
	}

	@Test
	@DisplayName("分页查询：页码或每页数量小于 1 返回 400")
	void getWithInvalidPage() throws Exception {
		mockMvc.perform(get("/users").param("pageNumber", "0").param("pageSize", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(400));
		mockMvc.perform(get("/users").param("pageNumber", "1").param("pageSize", "0"))
				.andExpect(jsonPath("$.code").value(400));
	}

	@Test
	@DisplayName("按 id 查询，不存在返回 404")
	void getById() throws Exception {
		long id = addUser("ut_one", null);

		mockMvc.perform(get("/users/" + id))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.name").value("ut_one"))
				.andExpect(jsonPath("$.result.password").doesNotExist());
		mockMvc.perform(get("/users/" + Long.MAX_VALUE))
				.andExpect(jsonPath("$.code").value(404));
	}

	@Test
	@DisplayName("部分更新：只改传了的字段，更新时间跟着变")
	void editPartially() throws Exception {
		long id = addUser("ut_edit", "ut_edit@example.com");
		JsonNode before = jsonMapper.readTree(mockMvc.perform(get("/users/" + id)).andReturn().getResponse().getContentAsString());

		mockMvc.perform(patch("/users/" + id).contentType(MediaType.APPLICATION_JSON).content("""
						{"realName": "李四"}
						"""))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.realName").value("李四"))
				.andExpect(jsonPath("$.result.email").value("ut_edit@example.com"))
				.andExpect(jsonPath("$.result.gender").value("UNKNOWN"));

		long updateTime = jsonMapper.readTree(mockMvc.perform(get("/users/" + id)).andReturn().getResponse().getContentAsString())
				.path("result").path("updateTime").asLong();
		assertThat(updateTime).isGreaterThan(before.path("result").path("updateTime").asLong());
	}

	@Test
	@DisplayName("部分更新：带 password 即重设密码")
	void editPassword() throws Exception {
		long id = addUser("ut_pwd", null);

		mockMvc.perform(patch("/users/" + id).contentType(MediaType.APPLICATION_JSON).content("""
						{"password": "newPassword456"}
						"""))
				.andExpect(jsonPath("$.code").value(200));

		String stored = dsl.select(USER.PASSWORD).from(USER).where(USER.ID.eq(id)).fetchOne(USER.PASSWORD);
		assertThat(passwordEncoder.matches("newPassword456", stored)).isTrue();
	}

	@Test
	@DisplayName("部分更新：改成别人的用户名返回 409，只改自己用户名的大小写可以")
	void editNameConflict() throws Exception {
		addUser("ut_taken", null);
		long id = addUser("ut_mine", null);

		mockMvc.perform(patch("/users/" + id).contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "UT_TAKEN"}
						"""))
				.andExpect(jsonPath("$.code").value(409));
		mockMvc.perform(patch("/users/" + id).contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "UT_MINE"}
						"""))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.name").value("UT_MINE"));
	}

	@Test
	@DisplayName("部分更新：用户不存在返回 404")
	void editNotFound() throws Exception {
		mockMvc.perform(patch("/users/" + Long.MAX_VALUE).contentType(MediaType.APPLICATION_JSON).content("""
						{"realName": "李四"}
						"""))
				.andExpect(jsonPath("$.code").value(404));
	}

	@Test
	@DisplayName("删除用户：连同其角色分配一起删除；再删返回 404")
	void deleteById() throws Exception {
		long id = addUser("ut_del", null);
		long roleId = dsl.insertInto(ROLE, ROLE.NAME, ROLE.DESCRIPTION, ROLE.STATUS)
				.values(PREFIX + "role", "", "ENABLED")
				.returning(ROLE.ID).fetchOne(ROLE.ID);
		dsl.insertInto(USER_ROLE, USER_ROLE.USER_ID, USER_ROLE.ROLE_ID).values(id, roleId).execute();

		mockMvc.perform(delete("/users/" + id))
				.andExpect(jsonPath("$.code").value(200));
		assertThat(dsl.fetchExists(USER_ROLE, USER_ROLE.USER_ID.eq(id))).isFalse();
		mockMvc.perform(get("/users/" + id))
				.andExpect(jsonPath("$.code").value(404));
		mockMvc.perform(delete("/users/" + id))
				.andExpect(jsonPath("$.code").value(404));
	}

}
