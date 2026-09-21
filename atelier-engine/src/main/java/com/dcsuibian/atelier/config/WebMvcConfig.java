package com.dcsuibian.atelier.config;

import com.dcsuibian.atelier.interceptor.AuthenticationInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

	/**
	 * 除 /session 外一律要求登录。
	 * <p>
	 * /session 三个方法都得放行：GET 未登录时返回 user 为 null 是前端判断登录态的依据，
	 * POST 是登录本身，DELETE 放行是为了让会话过期后登出仍然调得动，不至于卡在页面上
	 */
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new AuthenticationInterceptor())
				.addPathPatterns("/**")
				.excludePathPatterns("/session", "/error");
	}

}
