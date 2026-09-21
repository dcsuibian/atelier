package com.dcsuibian.atelier.service;

import com.dcsuibian.atelier.domain.User;
import com.dcsuibian.atelier.qo.UserQo;
import com.dcsuibian.atelier.vo.PageWrapper;

import java.util.Optional;

public interface UserService {

	PageWrapper<User> get(UserQo qo, int pageNumber, int pageSize);

	User getById(long id);

	Optional<User> findById(long id);

	User add(User user);

	/**
	 * 只更新非 null 的字段；带 password 即重设密码。超级管理员不能被禁用
	 */
	User editPartially(User user);

	/**
	 * 连同该用户的角色分配一起删除。超级管理员不能被删除
	 */
	void deleteById(long id);

	/**
	 * 登录判定。用户名不区分大小写；用户不存在与密码错误返回同样的错误，调用方无法借此探测用户名是否存在
	 */
	User login(String name, String password);

	/**
	 * 用户表为空时创建超级管理员（id 1）。已存在则什么也不做
	 */
	void ensureSuperAdmin(String initialPassword);

}
