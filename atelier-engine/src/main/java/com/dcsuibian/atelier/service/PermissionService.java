package com.dcsuibian.atelier.service;

import com.dcsuibian.atelier.domain.Permission;
import com.dcsuibian.atelier.qo.PermissionQo;
import com.dcsuibian.atelier.vo.PageWrapper;

public interface PermissionService {

	PageWrapper<Permission> get(PermissionQo qo, int pageNumber, int pageSize);

	/**
	 * 把 permissions.yml 同步进库：新增的插入，变化的更新，文件里没有的置为禁用（不删除，角色上的分配得以保留）
	 */
	void sync();

}
