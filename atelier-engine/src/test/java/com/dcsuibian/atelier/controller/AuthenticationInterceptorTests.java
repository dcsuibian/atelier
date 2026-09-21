package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.IntegrationTests;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 认证拦截是横切关注点，集中在这里验证一次。别的测试由基类默认带上已登录会话，各测各的那件事
 */
public class AuthenticationInterceptorTests extends IntegrationTests {

	@Autowired
	MockMvc mockMvc;

	@Test
	@DisplayName("未登录访问业务接口返回真实 HTTP 401，body 仍是 ResponseWrapper")
	void unauthenticated() throws Exception {
		mockMvc.perform(get("/users").param("pageNumber", "1").param("pageSize", "10").with(anonymous()))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value(401))
				.andExpect(jsonPath("$.message").value("未登录"))
				.andExpect(jsonPath("$.result").isEmpty())
				.andExpect(jsonPath("$.timestamp").isNumber());
	}

	@Test
	@DisplayName("已登录正常放行")
	void authenticated() throws Exception {
		mockMvc.perform(get("/users").param("pageNumber", "1").param("pageSize", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(200));
	}

	@Test
	@DisplayName("GET /session 未登录也放行，前端靠它判断登录态")
	void sessionQueryIsOpen() throws Exception {
		mockMvc.perform(get("/session").with(anonymous()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.result.user").isEmpty());
	}

	@Test
	@DisplayName("未登录也能调登出，免得会话过期后前端卡在页面上")
	void logoutIsOpen() throws Exception {
		mockMvc.perform(delete("/session").with(anonymous()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(200));
	}

	@Test
	@DisplayName("未登录访问不存在的路径得到 401 而非 404：拦截器先于路由匹配，不暴露哪些路径存在")
	void unknownPathWhenAnonymous() throws Exception {
		mockMvc.perform(get("/no-such-path").with(anonymous()))
				.andExpect(status().isUnauthorized());
		mockMvc.perform(get("/no-such-path"))
				.andExpect(status().isNotFound());
	}

}
