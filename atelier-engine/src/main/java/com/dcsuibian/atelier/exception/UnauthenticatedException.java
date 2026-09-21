package com.dcsuibian.atelier.exception;

/**
 * 未登录。刻意不复用 BusinessException：后者一律返回 HTTP 200 + 业务码，
 * 而未登录要的是真实 HTTP 401，好让前端在 http 层统一拦截
 */
public class UnauthenticatedException extends RuntimeException {

	public UnauthenticatedException() {
		super("未登录");
	}

}
