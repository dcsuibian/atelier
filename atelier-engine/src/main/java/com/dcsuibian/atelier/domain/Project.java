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
public class Project {

	@Null(groups = Add.class, message = "新增项目时不能指定ID")
	private Long id;

	@NotBlank(groups = {Add.class, Edit.class}, message = "项目名称不能为空")
	@Size(groups = {Add.class, Edit.class, EditPartially.class}, min = 1, max = 255, message = "项目名称长度必须在1到255个字符之间")
	private String name;

	/**
	 * 负责人。写入时只看 id；读出时带上 id、用户名与真实姓名，其余字段为空。
	 * 不加 @Valid：级联校验会套用 User 自己新增、编辑时的规则
	 */
	@NotNull(groups = {Add.class, Edit.class}, message = "负责人不能为空")
	private User owner;

	/**
	 * 不传时当作空串，库里「没有描述」只有空串这一种表示
	 */
	private String description;

	private Instant createTime;

	private Instant updateTime;

}
