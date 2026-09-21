package com.dcsuibian.atelier.domain;

import com.dcsuibian.atelier.validation.Add;
import com.dcsuibian.atelier.validation.Edit;
import com.dcsuibian.atelier.validation.EditPartially;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class User {

	@Null(groups = Add.class, message = "新增用户时不能指定ID")
	private Long id;

	@NotNull(groups = {Add.class, Edit.class}, message = "用户名不能为空")
	@Size(groups = {Add.class, Edit.class, EditPartially.class}, min = 2, max = 16, message = "用户名长度必须在2到16个字符之间")
	private String name;

	/**
	 * 明文，只接收不输出。BCrypt 只认前 72 字节，字节数的上限由 service 校验
	 */
	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	@NotBlank(groups = {Add.class, Edit.class}, message = "密码不能为空")
	@Size(groups = {Add.class, Edit.class, EditPartially.class}, min = 6, max = 72, message = "密码长度必须在6到72个字符之间")
	private String password;

	@Size(groups = {Add.class, Edit.class, EditPartially.class}, min = 3, max = 20, message = "手机号长度必须在3到20个字符之间")
	private String phoneNumber;

	@NotBlank(groups = {Add.class, Edit.class}, message = "真实姓名不能为空")
	@Size(groups = {Add.class, Edit.class, EditPartially.class}, max = 20, message = "真实姓名长度不能超过20个字符")
	private String realName;

	private String avatar;

	@Size(groups = {Add.class, Edit.class, EditPartially.class}, min = 1, max = 255, message = "邮箱长度必须在1到255个字符之间")
	@Email(groups = {Add.class, Edit.class, EditPartially.class}, message = "邮箱格式不正确")
	private String email;

	@NotNull(groups = {Add.class, Edit.class}, message = "性别不能为空")
	private Gender gender;

	/**
	 * 新增时不传默认启用
	 */
	@NotNull(groups = Edit.class, message = "状态不能为空")
	private Status status;

	private Instant createTime;

	private Instant updateTime;

	public enum Gender {
		MALE, FEMALE, UNKNOWN
	}

	public enum Status {
		ENABLED, DISABLED
	}

}
