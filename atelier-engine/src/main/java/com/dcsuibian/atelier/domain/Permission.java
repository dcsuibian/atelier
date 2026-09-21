package com.dcsuibian.atelier.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * 权限点由 permissions.yml 定义、启动时同步进库，接口只读
 */
@Getter
@Setter
public class Permission {

	private Long id;

	private String code;

	private String name;

	private String description;

	private Status status;

	private Instant createTime;

	private Instant updateTime;

	public enum Status {
		ENABLED, DISABLED
	}

}
