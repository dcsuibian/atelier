package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.IntegrationTests;
import jakarta.servlet.http.Cookie;
import org.jooq.DSLContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static com.dcsuibian.atelier.jooq.generated.Tables.USER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

public class SessionControllerTests extends IntegrationTests {

	private static final String NAME = "st_user";
	private static final String PASSWORD = "password123";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	DSLContext dsl;

	@Autowired
	PasswordEncoder passwordEncoder;

	@BeforeEach
	void setUp() {
		dsl.insertInto(USER, USER.NAME, USER.PASSWORD, USER.REAL_NAME, USER.GENDER, USER.STATUS)
				.values(NAME, passwordEncoder.encode(PASSWORD), "会话测试", "UNKNOWN", "ENABLED")
				.execute();
	}

	@AfterEach
	void tearDown() {
		dsl.deleteFrom(USER).where(USER.NAME.eq(NAME)).execute();
	}

	private static MockHttpServletRequestBuilder login(String name, String password) {
		return post("/session").contentType(MediaType.APPLICATION_JSON).content("""
				{"name": "%s", "password": "%s"}
				""".formatted(name, password));
	}

	/**
	 * 登录成功，返回会话 Cookie
	 */
	private Cookie loginAndGetCookie(Cookie... cookies) throws Exception {
		MockHttpServletRequestBuilder request = login(NAME, PASSWORD);
		if (cookies.length > 0) {
			request = request.cookie(cookies);
		} else {
			// 不指定就以未登录的身份登录，否则会复用基类的默认会话，把它的 id 和 userId 一起改掉
			request = request.with(anonymous());
		}
		Cookie cookie = mockMvc.perform(request)
				.andExpect(jsonPath("$.code").value(200))
				.andReturn().getResponse().getCookie(SESSION_COOKIE);
		assertThat(cookie).isNotNull();
		return cookie;
	}

	@Test
	@DisplayName("未登录时返回 200，user 为 null")
	void notLoggedIn() throws Exception {
		mockMvc.perform(get("/session").with(anonymous()))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.user").isEmpty());
	}

	@Test
	@DisplayName("登录后凭 Cookie 取到会话；用户名不区分大小写；响应不带密码")
	void login() throws Exception {
		mockMvc.perform(login("ST_USER", PASSWORD).with(anonymous()))
				.andExpect(jsonPath("$.code").value(200))
				.andExpect(jsonPath("$.result.user.name").value(NAME))
				.andExpect(jsonPath("$.result.user.password").doesNotExist())
				.andExpect(jsonPath("$.result.loginTime").isNumber());

		Cookie cookie = loginAndGetCookie();
		mockMvc.perform(get("/session").cookie(cookie))
				.andExpect(jsonPath("$.result.user.name").value(NAME))
				.andExpect(jsonPath("$.result.loginTime").isNumber());
	}

	@Test
	@DisplayName("用户不存在与密码错误返回同样的错误")
	void wrongCredentials() throws Exception {
		mockMvc.perform(login(NAME, "wrong-password").with(anonymous()))
				.andExpect(jsonPath("$.code").value(400))
				.andExpect(jsonPath("$.message").value("用户名或密码错误"));
		mockMvc.perform(login("st_nobody", PASSWORD).with(anonymous()))
				.andExpect(jsonPath("$.code").value(400))
				.andExpect(jsonPath("$.message").value("用户名或密码错误"));
	}

	@Test
	@DisplayName("已禁用的账号密码正确时返回 403")
	void disabledUser() throws Exception {
		dsl.update(USER).set(USER.STATUS, "DISABLED").where(USER.NAME.eq(NAME)).execute();
		mockMvc.perform(login(NAME, PASSWORD).with(anonymous()))
				.andExpect(jsonPath("$.code").value(403));
	}

	@Test
	@DisplayName("登出后会话失效")
	void logout() throws Exception {
		Cookie cookie = loginAndGetCookie();
		mockMvc.perform(delete("/session").cookie(cookie))
				.andExpect(jsonPath("$.code").value(200));
		mockMvc.perform(get("/session").cookie(cookie))
				.andExpect(jsonPath("$.result.user").isEmpty());
	}

	@Test
	@DisplayName("登录时更换会话 id，登录前的 id 作废")
	void sessionIdRotates() throws Exception {
		Cookie first = loginAndGetCookie();
		Cookie second = loginAndGetCookie(first);
		assertThat(second.getValue()).isNotEqualTo(first.getValue());
		mockMvc.perform(get("/session").cookie(first))
				.andExpect(jsonPath("$.result.user").isEmpty());
		mockMvc.perform(get("/session").cookie(second))
				.andExpect(jsonPath("$.result.user.name").value(NAME));
	}

	@Test
	@DisplayName("登录后用户被禁用，会话随之失效")
	void userDisabledAfterLogin() throws Exception {
		Cookie cookie = loginAndGetCookie();
		dsl.update(USER).set(USER.STATUS, "DISABLED").where(USER.NAME.eq(NAME)).execute();
		mockMvc.perform(get("/session").cookie(cookie))
				.andExpect(jsonPath("$.result.user").isEmpty());
	}

}
