package com.dcsuibian.atelier;

import jakarta.servlet.http.Cookie;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static com.dcsuibian.atelier.constant.SessionConstants.LOGIN_TIME;
import static com.dcsuibian.atelier.constant.SessionConstants.USER_ID;
import static com.dcsuibian.atelier.constant.UserConstants.SUPER_ADMIN_ID;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * 集成测试基类：Testcontainers 起 PostgreSQL 与 Redis，所有子类共享同一个 Spring 上下文和容器。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, IntegrationTests.DefaultSessionConfiguration.class})
public abstract class IntegrationTests {

	public static final String SESSION_COOKIE = "SESSION";

	/**
	 * 把请求变回未登录状态，覆盖掉默认会话。
	 * <p>
	 * 它作为子类自己的后置处理器，排在基类那个之后执行，所以能清掉默认带上的 Cookie
	 */
	protected static RequestPostProcessor anonymous() {
		return request -> {
			request.setCookies();
			return request;
		};
	}

	/**
	 * 所有请求默认带一个已登录的会话，否则会被 AuthenticationInterceptor 拦成 401。
	 * <p>
	 * 认证是横切关注点，由 AuthenticationInterceptorTests 集中验证一次就够，其余测试各管各的那件事，
	 * 不必每个请求都重复写。要测未登录的行为就加上 {@link #anonymous()}。
	 * <p>
	 * 会话必须经 SessionRepository 真造一个、再按 Cookie 传：Spring Session 的 filter 会接管
	 * getSession()，只认 Cookie 里的会话 id，请求上预设的 MockHttpSession 它根本不看
	 */
	@TestConfiguration
	static class DefaultSessionConfiguration {

		@Bean
		@SuppressWarnings({"rawtypes", "unchecked"})
		MockMvcBuilderCustomizer loggedInByDefault(SessionRepository sessionRepository,
				CookieSerializer cookieSerializer) {
			Session session = sessionRepository.createSession();
			session.setAttribute(USER_ID, SUPER_ADMIN_ID);
			session.setAttribute(LOGIN_TIME, Instant.now());
			sessionRepository.save(session);

			// 借 CookieSerializer 写出 Cookie，免得自己拼它的编码方式
			MockHttpServletResponse response = new MockHttpServletResponse();
			cookieSerializer.writeCookieValue(
					new CookieSerializer.CookieValue(new MockHttpServletRequest(), response, session.getId()));
			Cookie[] sessionCookies = response.getCookies();

			return builder -> builder.defaultRequest(get("/").with(request -> {
				// 请求自己带了会话就不插手，否则 SessionControllerTests 那些登录流程会拿到两个 SESSION
				if (!hasSessionCookie(request)) {
					List<Cookie> cookies = new ArrayList<>();
					if (null != request.getCookies()) {
						cookies.addAll(Arrays.asList(request.getCookies()));
					}
					cookies.addAll(Arrays.asList(sessionCookies));
					request.setCookies(cookies.toArray(new Cookie[0]));
				}
				return request;
			}));
		}

		private static boolean hasSessionCookie(MockHttpServletRequest request) {
			Cookie[] cookies = request.getCookies();
			return null != cookies && Arrays.stream(cookies).anyMatch(c -> SESSION_COOKIE.equals(c.getName()));
		}

	}

}
