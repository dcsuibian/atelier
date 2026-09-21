package com.dcsuibian.atelier.service.impl;

import com.dcsuibian.atelier.constant.UserConstants;
import com.dcsuibian.atelier.converter.UserConverter;
import com.dcsuibian.atelier.domain.User;
import com.dcsuibian.atelier.exception.BusinessException;
import com.dcsuibian.atelier.jooq.generated.tables.records.UserRecord;
import com.dcsuibian.atelier.qo.UserQo;
import com.dcsuibian.atelier.service.RbacService;
import com.dcsuibian.atelier.service.UserService;
import com.dcsuibian.atelier.vo.PageWrapper;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.UpdateSetMoreStep;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static com.dcsuibian.atelier.jooq.generated.Tables.USER;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER_ROLE;

@Slf4j
@Service
public class UserServiceImpl implements UserService {

	/**
	 * BCrypt 只处理前 72 字节，超出部分 Spring Security 会直接拒绝
	 */
	private static final int BCRYPT_MAX_BYTES = 72;

	private final DSLContext dsl;
	private final UserConverter converter;
	private final PasswordEncoder passwordEncoder;
	private final RbacService rbacService;

	@Autowired
	public UserServiceImpl(DSLContext dsl, UserConverter converter, PasswordEncoder passwordEncoder, RbacService rbacService) {
		this.dsl = dsl;
		this.converter = converter;
		this.passwordEncoder = passwordEncoder;
		this.rbacService = rbacService;
	}

	private String encodePassword(String password) {
		if (password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
			throw new BusinessException("密码不能超过" + BCRYPT_MAX_BYTES + "字节");
		}
		return passwordEncoder.encode(password);
	}

	/**
	 * 用户名、邮箱不区分大小写。excludedId 用于更新时排除自己
	 */
	private void checkUnique(User user, Long excludedId) {
		Condition others = null == excludedId ? DSL.noCondition() : USER.ID.ne(excludedId);
		if (null != user.getName() && dsl.fetchExists(USER, USER.NAME.equalIgnoreCase(user.getName()).and(others))) {
			throw new BusinessException("用户名已存在", 409);
		}
		if (null != user.getEmail() && dsl.fetchExists(USER, USER.EMAIL.equalIgnoreCase(user.getEmail()).and(others))) {
			throw new BusinessException("邮箱已被使用", 409);
		}
	}

	private Condition buildCondition(UserQo qo) {
		Condition condition = DSL.noCondition();
		if (null != qo.getStatus()) {
			condition = condition.and(USER.STATUS.eq(qo.getStatus().name()));
		}
		if (null != qo.getSearchText() && !qo.getSearchText().isBlank()) {
			// containsIgnoreCase 会转义 % 和 _，搜索文本按字面匹配
			String text = qo.getSearchText();
			condition = condition.and(USER.NAME.containsIgnoreCase(text)
					.or(USER.REAL_NAME.containsIgnoreCase(text))
					.or(USER.PHONE_NUMBER.containsIgnoreCase(text)));
		}
		return condition;
	}

	@Override
	@Transactional(readOnly = true)
	public PageWrapper<User> get(UserQo qo, int pageNumber, int pageSize) {
		Condition condition = buildCondition(qo);
		long total = dsl.fetchCount(USER, condition);
		List<User> users = dsl.selectFrom(USER)
				.where(condition)
				.orderBy(USER.ID.asc())
				.limit(pageSize)
				.offset((long) (pageNumber - 1) * pageSize)
				.fetch(converter::toDomain);
		return PageWrapper.of(users, total, pageNumber, pageSize);
	}

	@Override
	@Transactional(readOnly = true)
	public User getById(long id) {
		return findById(id).orElseThrow(() -> new BusinessException("用户不存在", 404));
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<User> findById(long id) {
		return Optional.ofNullable(dsl.fetchOne(USER, USER.ID.eq(id))).map(converter::toDomain);
	}

	@Override
	@Transactional
	public User add(User user) {
		checkUnique(user, null);
		OffsetDateTime now = OffsetDateTime.now();
		User.Status status = null == user.getStatus() ? User.Status.ENABLED : user.getStatus();
		UserRecord record = dsl.insertInto(USER)
				.set(USER.NAME, user.getName())
				.set(USER.PASSWORD, encodePassword(user.getPassword()))
				.set(USER.PHONE_NUMBER, user.getPhoneNumber())
				.set(USER.REAL_NAME, user.getRealName())
				.set(USER.AVATAR, user.getAvatar())
				.set(USER.EMAIL, user.getEmail())
				.set(USER.GENDER, user.getGender().name())
				.set(USER.STATUS, status.name())
				.set(USER.CREATE_TIME, now)
				.set(USER.UPDATE_TIME, now)
				.returning()
				.fetchOne();
		return converter.toDomain(record);
	}

	@Override
	@Transactional
	public User editPartially(User user) {
		if (UserConstants.SUPER_ADMIN_ID == user.getId() && User.Status.DISABLED == user.getStatus()) {
			throw new BusinessException("不能禁用超级管理员");
		}
		checkUnique(user, user.getId());
		UpdateSetMoreStep<UserRecord> update = dsl.update(USER).set(USER.UPDATE_TIME, OffsetDateTime.now());
		if (null != user.getName()) {
			update = update.set(USER.NAME, user.getName());
		}
		if (null != user.getPassword()) {
			update = update.set(USER.PASSWORD, encodePassword(user.getPassword()));
		}
		if (null != user.getPhoneNumber()) {
			update = update.set(USER.PHONE_NUMBER, user.getPhoneNumber());
		}
		if (null != user.getRealName()) {
			update = update.set(USER.REAL_NAME, user.getRealName());
		}
		if (null != user.getAvatar()) {
			update = update.set(USER.AVATAR, user.getAvatar());
		}
		if (null != user.getEmail()) {
			update = update.set(USER.EMAIL, user.getEmail());
		}
		if (null != user.getGender()) {
			update = update.set(USER.GENDER, user.getGender().name());
		}
		if (null != user.getStatus()) {
			update = update.set(USER.STATUS, user.getStatus().name());
		}
		UserRecord record = update.where(USER.ID.eq(user.getId())).returning().fetchOne();
		if (null == record) {
			throw new BusinessException("用户不存在", 404);
		}
		if (null != user.getStatus()) {
			// 禁用的用户可用权限为空
			rbacService.evictAvailablePermissionCodes(user.getId());
		}
		return converter.toDomain(record);
	}

	@Override
	@Transactional
	public void deleteById(long id) {
		if (UserConstants.SUPER_ADMIN_ID == id) {
			throw new BusinessException("不能删除超级管理员");
		}
		dsl.deleteFrom(USER_ROLE).where(USER_ROLE.USER_ID.eq(id)).execute();
		if (0 == dsl.deleteFrom(USER).where(USER.ID.eq(id)).execute()) {
			throw new BusinessException("用户不存在", 404);
		}
		rbacService.evictAvailablePermissionCodes(id);
	}

	@Override
	@Transactional(readOnly = true)
	public User login(String name, String password) {
		UserRecord record = dsl.fetchOne(USER, USER.NAME.equalIgnoreCase(name));
		if (null == record || !passwordEncoder.matches(password, record.getPassword())) {
			throw new BusinessException("用户名或密码错误");
		}
		// 密码正确才告知禁用，否则可以借此探测用户名
		if (User.Status.DISABLED.name().equals(record.getStatus())) {
			throw new BusinessException("账号已被禁用", 403);
		}
		return converter.toDomain(record);
	}

	@Override
	@Transactional
	public void ensureSuperAdmin(String initialPassword) {
		if (dsl.fetchExists(USER, USER.ID.eq(UserConstants.SUPER_ADMIN_ID))) {
			return;
		}
		// 只在全新的库上创建：表里已有别人时，id 1 的空缺说明库被手工动过，不要自作主张
		if (dsl.fetchExists(USER)) {
			log.warn("用户表非空但缺少超级管理员（id {}），跳过创建", UserConstants.SUPER_ADMIN_ID);
			return;
		}
		if (null == initialPassword || initialPassword.isBlank()) {
			throw new IllegalStateException("首次启动需要配置 atelier.super-admin.initial-password，用于创建超级管理员");
		}
		OffsetDateTime now = OffsetDateTime.now();
		dsl.insertInto(USER)
				.set(USER.ID, UserConstants.SUPER_ADMIN_ID)
				.set(USER.NAME, "admin")
				.set(USER.PASSWORD, encodePassword(initialPassword))
				.set(USER.REAL_NAME, "超级管理员")
				.set(USER.GENDER, User.Gender.UNKNOWN.name())
				.set(USER.STATUS, User.Status.ENABLED.name())
				.set(USER.CREATE_TIME, now)
				.set(USER.UPDATE_TIME, now)
				.onConflictDoNothing()
				.execute();
		// 显式指定了 id，序列没有前进；不推一下的话，下一个新增用户会撞上 id 1
		dsl.execute("SELECT setval(pg_get_serial_sequence('\"user\"', 'id'), 1)");
		log.info("已创建超级管理员 admin");
	}

}
