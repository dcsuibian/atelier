package com.dcsuibian.atelier.service;

import com.dcsuibian.atelier.domain.User;
import com.dcsuibian.atelier.qo.UserQo;
import com.dcsuibian.atelier.vo.PageWrapper;

public interface UserService {

	PageWrapper<User> get(UserQo qo, int pageNumber, int pageSize);

	User getById(long id);

	User add(User user);

	/**
	 * 只更新非 null 的字段；带 password 即重设密码
	 */
	User editPartially(User user);

	/**
	 * 连同该用户的角色分配一起删除
	 */
	void deleteById(long id);

}
