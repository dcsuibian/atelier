package com.dcsuibian.atelier.qo;

import com.dcsuibian.atelier.domain.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleQo {

	private Role.Status status;

	/**
	 * 模糊匹配角色名称、描述，不区分大小写
	 */
	private String searchText;

}
