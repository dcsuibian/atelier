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

import static com.dcsuibian.atelier.jooq.generated.Tables.PROJECT;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

public class ProjectControllerTests extends IntegrationTests {

	private static final String PREFIX = "pt_";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JsonMapper jsonMapper;

	@Autowired
	DSLContext dsl;

	@AfterEach
	void tearDown() {
		dsl.deleteFrom(PROJECT).where(PROJECT.NAME.startsWith(PREFIX)).execute();
		dsl.deleteFrom(USER).where(USER.NAME.startsWith(PREFIX)).execute();
	}

	private long addUser(String name, String realName) {
		return dsl.insertInto(USER, USER.NAME, USER.PASSWORD, USER.REAL_NAME, USER.GENDER, USER.STATUS)
				.values(PREFIX + name, "x", realName, "UNKNOWN", "ENABLED")
				.returning(USER.ID).fetchOne(USER.ID);
	}

	private long addProject(String name, long ownerId) throws Exception {
		String response = mockMvc.perform(post("/projects").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "%s", "owner": {"id": %d}, "description": "测试项目"}
						""".formatted(name, ownerId)))
				.andExpect(jsonPath("$.code").value(200))
				.andReturn().getResponse().getContentAsString();
		return jsonMapper.readTree(response).path("result").path("id").asLong();
	}

	@Test
	@DisplayName("新增项目：返回带上负责人的用户名与姓名；负责人缺失或不存在返回 400")
	void add() throws Exception {
		long ownerId = addUser("owner", "张三");
		mockMvc.perform(post("/projects").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "pt_add", "owner": {"id": %d}, "description": "测试项目"}
						""".formatted(ownerId)))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.owner.id").value(ownerId))
				.andExpect(jsonPath("$.result.owner.name").value("pt_owner"))
				.andExpect(jsonPath("$.result.owner.realName").value("张三"))
				.andExpect(jsonPath("$.result.createTime").isNumber());

		mockMvc.perform(post("/projects").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "pt_no_owner", "description": "测试项目"}
						"""))
				.andExpect(jsonPath("$.code").value(400));
		mockMvc.perform(post("/projects").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "pt_bad_owner", "owner": {"id": -1}, "description": "测试项目"}
						"""))
				.andExpect(jsonPath("$.code").value(400));
	}

	@Test
	@DisplayName("分页查询：按搜索文本和负责人筛选")
	void getPaged() throws Exception {
		long a = addUser("a", "甲");
		long b = addUser("b", "乙");
		addProject("pt_list_1", a);
		addProject("pt_list_2", a);
		addProject("pt_list_3", b);

		mockMvc.perform(get("/projects").param("searchText", "PT_LIST").param("pageNumber", "1").param("pageSize", "10"))
				.andExpect(jsonPath("$.result.total").value(3));
		mockMvc.perform(get("/projects").param("searchText", "pt_list").param("ownerId", String.valueOf(a))
						.param("pageNumber", "1").param("pageSize", "10"))
				.andExpect(jsonPath("$.result.total").value(2))
				.andExpect(jsonPath("$.result.data[0].owner.realName").value("甲"));
	}

	@Test
	@DisplayName("部分更新：可以只换负责人；不存在返回 404")
	void editPartially() throws Exception {
		long a = addUser("edit_a", "甲");
		long b = addUser("edit_b", "乙");
		long id = addProject("pt_edit", a);

		mockMvc.perform(patch("/projects/" + id).contentType(MediaType.APPLICATION_JSON).content("""
						{"owner": {"id": %d}}
						""".formatted(b)))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.name").value("pt_edit"))
				.andExpect(jsonPath("$.result.owner.realName").value("乙"));
		mockMvc.perform(patch("/projects/-1").contentType(MediaType.APPLICATION_JSON).content("""
						{"name": "pt_none"}
						"""))
				.andExpect(jsonPath("$.code").value(404));
	}

	@Test
	@DisplayName("删除项目；再删返回 404。负责人还负责项目时不能删除")
	void deleteById() throws Exception {
		long ownerId = addUser("del", "丙");
		long id = addProject("pt_del", ownerId);

		mockMvc.perform(delete("/users/" + ownerId))
				.andExpect(jsonPath("$.code").value(409));

		mockMvc.perform(delete("/projects/" + id))
				.andExpect(jsonPath("$.code").value(200));
		assertThat(dsl.fetchExists(PROJECT, PROJECT.ID.eq(id))).isFalse();
		mockMvc.perform(delete("/projects/" + id))
				.andExpect(jsonPath("$.code").value(404));

		mockMvc.perform(delete("/users/" + ownerId))
				.andExpect(jsonPath("$.code").value(200));
	}

}
