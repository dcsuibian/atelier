package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.IntegrationTests;
import com.dcsuibian.atelier.service.PermissionService;
import org.jooq.DSLContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static com.dcsuibian.atelier.jooq.generated.Tables.PERMISSION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

public class PermissionControllerTests extends IntegrationTests {

	private static final String OBSOLETE_CODE = "pt:obsolete";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	DSLContext dsl;

	@Autowired
	PermissionService permissionService;

	@AfterEach
	void tearDown() {
		dsl.deleteFrom(PERMISSION).where(PERMISSION.CODE.eq(OBSOLETE_CODE)).execute();
	}

	@Test
	@DisplayName("启动时已把 permissions.yml 同步进库，可按搜索文本分页查询")
	void getPaged() throws Exception {
		mockMvc.perform(get("/permissions").param("searchText", "USER:").param("pageNumber", "1").param("pageSize", "100"))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.total").value(5))
				.andExpect(jsonPath("$.result.data[0].code").value("user:view"))
				.andExpect(jsonPath("$.result.data[0].status").value("ENABLED"));
	}

	@Test
	@DisplayName("同步：文件里没有的权限置为禁用而不是删除；没变化的权限不刷新更新时间")
	void sync() {
		dsl.insertInto(PERMISSION, PERMISSION.CODE, PERMISSION.NAME, PERMISSION.DESCRIPTION, PERMISSION.STATUS)
				.values(OBSOLETE_CODE, "已废弃", "文件里没有的权限", "ENABLED").execute();
		OffsetDateTime before = dsl.select(PERMISSION.UPDATE_TIME).from(PERMISSION)
				.where(PERMISSION.CODE.eq("user:view")).fetchOne(PERMISSION.UPDATE_TIME);

		permissionService.sync();

		assertThat(dsl.select(PERMISSION.STATUS).from(PERMISSION).where(PERMISSION.CODE.eq(OBSOLETE_CODE))
				.fetchOne(PERMISSION.STATUS)).isEqualTo("DISABLED");
		assertThat(dsl.select(PERMISSION.UPDATE_TIME).from(PERMISSION).where(PERMISSION.CODE.eq("user:view"))
				.fetchOne(PERMISSION.UPDATE_TIME)).isEqualTo(before);
	}

}
