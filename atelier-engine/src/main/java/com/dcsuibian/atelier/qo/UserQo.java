package com.dcsuibian.atelier.qo;

import com.dcsuibian.atelier.domain.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserQo {

	private User.Status status;

	/**
	 * 模糊匹配用户名、真实姓名、手机号，不区分大小写
	 */
	private String searchText;

}
