package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.domain.User;
import com.dcsuibian.atelier.dto.LoginDto;
import com.dcsuibian.atelier.service.UserService;
import com.dcsuibian.atelier.vo.ResponseWrapper;
import com.dcsuibian.atelier.vo.SessionVo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Optional;

import static com.dcsuibian.atelier.constant.SessionConstants.LOGIN_TIME;
import static com.dcsuibian.atelier.constant.SessionConstants.USER_ID;

/**
 * 登录态存在 Spring Session（Redis）里，会话 id 走 Cookie。
 * 会话里只存 userId 和登录时间，都是 JDK 自带类型，不需要为 Redis 另配序列化
 */
@RestController
@RequestMapping("/session")
public class SessionController {

	private final UserService userService;

	@Autowired
	public SessionController(UserService userService) {
		this.userService = userService;
	}

	/**
	 * 未登录也返回 200，user 为 null。用户已被删除或禁用时作废会话，按未登录返回
	 */
	@GetMapping
	public ResponseWrapper<SessionVo> get(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (null == session || !(session.getAttribute(USER_ID) instanceof Long userId)) {
			return ResponseWrapper.success(new SessionVo());
		}
		Optional<User> user = userService.findById(userId).filter(u -> User.Status.ENABLED == u.getStatus());
		if (user.isEmpty()) {
			session.invalidate();
			return ResponseWrapper.success(new SessionVo());
		}
		return ResponseWrapper.success(toVo(user.get(), (Instant) session.getAttribute(LOGIN_TIME)));
	}

	@PostMapping
	public ResponseWrapper<SessionVo> login(@RequestBody @Validated LoginDto dto, HttpServletRequest request) {
		User user = userService.login(dto.getName(), dto.getPassword());
		// 更换会话 id 防止会话固定：登录前的 id 作废，登录态只落在新 id 上
		HttpSession session = request.getSession();
		request.changeSessionId();
		Instant loginTime = Instant.now();
		session.setAttribute(USER_ID, user.getId());
		session.setAttribute(LOGIN_TIME, loginTime);
		return ResponseWrapper.success(toVo(user, loginTime));
	}

	@DeleteMapping
	public ResponseWrapper<Void> logout(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (null != session) {
			session.invalidate();
		}
		return ResponseWrapper.success();
	}

	private static SessionVo toVo(User user, Instant loginTime) {
		SessionVo vo = new SessionVo();
		vo.setUser(user);
		vo.setLoginTime(loginTime);
		return vo;
	}

}
