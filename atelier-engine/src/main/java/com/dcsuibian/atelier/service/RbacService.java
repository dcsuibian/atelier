package com.dcsuibian.atelier.service;

import com.dcsuibian.atelier.domain.Permission;
import com.dcsuibian.atelier.domain.Role;

import java.util.List;
import java.util.Set;

/**
 * 用户、角色、权限之间的关联，以及「某人有哪些权限」的计算与缓存
 */
public interface RbacService {

	/**
	 * 用户的全部角色，不论角色是否启用
	 */
	List<Role> getRolesByUserId(long userId);

	/**
	 * 整体替换用户的角色
	 */
	void setRolesToUser(long userId, List<Long> roleIds);

	/**
	 * 角色的全部权限，不论权限是否启用
	 */
	List<Permission> getPermissionsByRoleId(long roleId);

	/**
	 * 整体替换角色的权限
	 */
	void setPermissionsToRole(long roleId, List<Long> permissionIds);

	/**
	 * 用户当前可用的权限码，带缓存。用户已禁用为空；超级管理员为全部启用的权限；其余为启用角色中启用权限的并集
	 */
	Set<String> getAvailablePermissionCodes(long userId);

	/**
	 * 用户当前可用的权限详情，给前端决定展示什么
	 */
	List<Permission> getAvailablePermissions(long userId);

	/**
	 * 清除单个用户的缓存（在当前事务提交后执行）。该用户的角色、启用状态变化或被删除后调用
	 */
	void evictAvailablePermissionCodes(long userId);

	/**
	 * 清除全部用户的缓存（在当前事务提交后执行）。角色的权限或状态变化、权限同步后调用
	 */
	void evictAllAvailablePermissionCodes();

}
