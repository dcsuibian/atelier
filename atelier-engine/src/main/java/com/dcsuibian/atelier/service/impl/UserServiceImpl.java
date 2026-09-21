package com.dcsuibian.atelier.service.impl;

import com.dcsuibian.atelier.converter.UserConverter;
import com.dcsuibian.atelier.domain.User;
import com.dcsuibian.atelier.exception.BusinessException;
import com.dcsuibian.atelier.jooq.generated.tables.records.UserRecord;
import com.dcsuibian.atelier.qo.UserQo;
import com.dcsuibian.atelier.service.UserService;
import com.dcsuibian.atelier.vo.PageWrapper;
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

import static com.dcsuibian.atelier.jooq.generated.Tables.USER;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER_ROLE;

@Service
public class UserServiceImpl implements UserService {

	/**
	 * BCrypt 只处理前 72 字节，超出部分 Spring Security 会直接拒绝
	 */
	private static final int BCRYPT_MAX_BYTES = 72;

	private final DSLContext dsl;
	private final UserConverter converter;
	private final PasswordEncoder passwordEncoder;

	@Autowired
	public UserServiceImpl(DSLContext dsl, UserConverter converter, PasswordEncoder passwordEncoder) {
		this.dsl = dsl;
		this.converter = converter;
		this.passwordEncoder = passwordEncoder;
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
		UserRecord record = dsl.fetchOne(USER, USER.ID.eq(id));
		if (null == record) {
			throw new BusinessException("用户不存在", 404);
		}
		return converter.toDomain(record);
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
		return converter.toDomain(record);
	}

	@Override
	@Transactional
	public void deleteById(long id) {
		dsl.deleteFrom(USER_ROLE).where(USER_ROLE.USER_ID.eq(id)).execute();
		if (0 == dsl.deleteFrom(USER).where(USER.ID.eq(id)).execute()) {
			throw new BusinessException("用户不存在", 404);
		}
	}

}
