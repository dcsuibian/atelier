package com.dcsuibian.atelier.service;

import com.dcsuibian.atelier.domain.Role;
import com.dcsuibian.atelier.qo.RoleQo;
import com.dcsuibian.atelier.vo.PageWrapper;

public interface RoleService {

	PageWrapper<Role> get(RoleQo qo, int pageNumber, int pageSize);

	Role getById(long id);

	Role add(Role role);

	/**
	 * 只更新非 null 的字段
	 */
	Role editPartially(Role role);

	/**
	 * 仍分配给用户的角色不能删除；角色的权限分配随之删除
	 */
	void deleteById(long id);

}
