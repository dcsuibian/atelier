package com.dcsuibian.atelier.qo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectQo {

	private Long ownerId;

	/**
	 * 模糊匹配项目名称、描述，不区分大小写
	 */
	private String searchText;

}
