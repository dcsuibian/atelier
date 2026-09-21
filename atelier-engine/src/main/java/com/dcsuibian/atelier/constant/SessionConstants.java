package com.dcsuibian.atelier.constant;

/**
 * 会话属性名。SessionController 写入，AuthenticationInterceptor 读取，两边必须用同一份
 */
public class SessionConstants {

	public static final String USER_ID = "userId";

	public static final String LOGIN_TIME = "loginTime";

	private SessionConstants() {
	}

}
