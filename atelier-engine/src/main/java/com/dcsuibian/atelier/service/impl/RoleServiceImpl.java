package com.dcsuibian.atelier.service.impl;

import com.dcsuibian.atelier.converter.RoleConverter;
import com.dcsuibian.atelier.domain.Role;
import com.dcsuibian.atelier.exception.BusinessException;
import com.dcsuibian.atelier.jooq.generated.tables.records.RoleRecord;
import com.dcsuibian.atelier.qo.RoleQo;
import com.dcsuibian.atelier.service.RbacService;
import com.dcsuibian.atelier.service.RoleService;
import com.dcsuibian.atelier.vo.PageWrapper;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.UpdateSetMoreStep;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE;
import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE_PERMISSION;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER_ROLE;

@Service
public class RoleServiceImpl implements RoleService {

	private final DSLContext dsl;
	private final RoleConverter converter;
	private final RbacService rbacService;

	@Autowired
	public RoleServiceImpl(DSLContext dsl, RoleConverter converter, RbacService rbacService) {
		this.dsl = dsl;
		this.converter = converter;
		this.rbacService = rbacService;
	}

	/**
	 * excludedId 用于更新时排除自己
	 */
	private void checkUnique(Role role, Long excludedId) {
		Condition others = null == excludedId ? DSL.noCondition() : ROLE.ID.ne(excludedId);
		if (null != role.getName() && dsl.fetchExists(ROLE, ROLE.NAME.eq(role.getName()).and(others))) {
			throw new BusinessException("角色名称已存在", 409);
		}
	}

	private Condition buildCondition(RoleQo qo) {
		Condition condition = DSL.noCondition();
		if (null != qo.getStatus()) {
			condition = condition.and(ROLE.STATUS.eq(qo.getStatus().name()));
		}
		if (null != qo.getSearchText() && !qo.getSearchText().isBlank()) {
			String text = qo.getSearchText();
			condition = condition.and(ROLE.NAME.containsIgnoreCase(text).or(ROLE.DESCRIPTION.containsIgnoreCase(text)));
		}
		return condition;
	}

	@Override
	@Transactional(readOnly = true)
	public PageWrapper<Role> get(RoleQo qo, int pageNumber, int pageSize) {
		Condition condition = buildCondition(qo);
		long total = dsl.fetchCount(ROLE, condition);
		List<Role> roles = dsl.selectFrom(ROLE)
				.where(condition)
				.orderBy(ROLE.ID.asc())
				.limit(pageSize)
				.offset((long) (pageNumber - 1) * pageSize)
				.fetch(converter::toDomain);
		return PageWrapper.of(roles, total, pageNumber, pageSize);
	}

	@Override
	@Transactional(readOnly = true)
	public Role getById(long id) {
		RoleRecord record = dsl.fetchOne(ROLE, ROLE.ID.eq(id));
		if (null == record) {
			throw new BusinessException("角色不存在", 404);
		}
		return converter.toDomain(record);
	}

	@Override
	@Transactional
	public Role add(Role role) {
		checkUnique(role, null);
		OffsetDateTime now = OffsetDateTime.now();
		Role.Status status = null == role.getStatus() ? Role.Status.ENABLED : role.getStatus();
		RoleRecord record = dsl.insertInto(ROLE)
				.set(ROLE.NAME, role.getName())
				.set(ROLE.DESCRIPTION, role.getDescription())
				.set(ROLE.STATUS, status.name())
				.set(ROLE.CREATE_TIME, now)
				.set(ROLE.UPDATE_TIME, now)
				.returning()
				.fetchOne();
		return converter.toDomain(record);
	}

	@Override
	@Transactional
	public Role editPartially(Role role) {
		checkUnique(role, role.getId());
		UpdateSetMoreStep<RoleRecord> update = dsl.update(ROLE).set(ROLE.UPDATE_TIME, OffsetDateTime.now());
		if (null != role.getName()) {
			update = update.set(ROLE.NAME, role.getName());
		}
		if (null != role.getDescription()) {
			update = update.set(ROLE.DESCRIPTION, role.getDescription());
		}
		if (null != role.getStatus()) {
			update = update.set(ROLE.STATUS, role.getStatus().name());
		}
		RoleRecord record = update.where(ROLE.ID.eq(role.getId())).returning().fetchOne();
		if (null == record) {
			throw new BusinessException("角色不存在", 404);
		}
		if (null != role.getStatus()) {
			// 停用的角色不再提供权限，影响所有拥有它的用户
			rbacService.evictAllAvailablePermissionCodes();
		}
		return converter.toDomain(record);
	}

	@Override
	@Transactional
	public void deleteById(long id) {
		// 静默收回用户的角色会让他们的权限悄悄变少，所以要求先解除分配
		if (dsl.fetchExists(USER_ROLE, USER_ROLE.ROLE_ID.eq(id))) {
			throw new BusinessException("角色仍分配给用户，请先解除分配", 409);
		}
		dsl.deleteFrom(ROLE_PERMISSION).where(ROLE_PERMISSION.ROLE_ID.eq(id)).execute();
		if (0 == dsl.deleteFrom(ROLE).where(ROLE.ID.eq(id)).execute()) {
			throw new BusinessException("角色不存在", 404);
		}
	}

}
