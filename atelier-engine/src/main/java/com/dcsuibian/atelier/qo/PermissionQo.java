package com.dcsuibian.atelier.qo;

import com.dcsuibian.atelier.domain.Permission;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PermissionQo {

	private Permission.Status status;

	/**
	 * 模糊匹配权限代码、名称、描述，不区分大小写
	 */
	private String searchText;

}
