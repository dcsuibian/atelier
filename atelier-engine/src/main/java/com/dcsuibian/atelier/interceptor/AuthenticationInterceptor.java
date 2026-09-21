package com.dcsuibian.atelier.interceptor;

import com.dcsuibian.atelier.constant.SessionConstants;
import com.dcsuibian.atelier.exception.UnauthenticatedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 认证拦截：只回答「登录了没」，不回答「能不能做这件事」。
 * <p>
 * 授权留给下游按自己的场景补——权限在本项目里只用于控制前端的展示与可操作性。
 * <p>
 * 只看会话里有没有 userId，不查库确认用户仍存在且启用：那是每请求一次查询的成本，
 * 而本项目的会话有效期本就不长。代价是用户被删除或禁用后，他手上的会话还能调业务接口，
 * 直到前端下一次导航走 GET /session 才被踢出去。要堵住这个口子，就在这里查一次用户状态
 */
public class AuthenticationInterceptor implements HandlerInterceptor {

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		HttpSession session = request.getSession(false);
		if (null == session || !(session.getAttribute(SessionConstants.USER_ID) instanceof Long)) {
			throw new UnauthenticatedException();
		}
		return true;
	}

}
