package com.dcsuibian.atelier.domain;

import com.dcsuibian.atelier.validation.Add;
import com.dcsuibian.atelier.validation.Edit;
import com.dcsuibian.atelier.validation.EditPartially;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class Role {

	@Null(groups = Add.class, message = "新增角色时不能指定ID")
	private Long id;

	@NotBlank(groups = {Add.class, Edit.class}, message = "角色名称不能为空")
	@Size(groups = {Add.class, Edit.class, EditPartially.class}, min = 1, max = 255, message = "角色名称长度必须在1到255个字符之间")
	private String name;

	@NotNull(groups = {Add.class, Edit.class}, message = "角色描述不能为空")
	private String description;

	/**
	 * 新增时不传默认启用
	 */
	@NotNull(groups = Edit.class, message = "状态不能为空")
	private Status status;

	private Instant createTime;

	private Instant updateTime;

	public enum Status {
		ENABLED, DISABLED
	}

}
