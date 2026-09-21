package com.dcsuibian.atelier.vo;

import com.dcsuibian.atelier.domain.User;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * 会话信息。会话里只存 userId 和登录时间，user 每次现查，所以用户被删除或禁用后会话自然失效
 */
@Getter
@Setter
public class SessionVo {

	private User user; // 未登录为 null
	private Instant loginTime;

}
