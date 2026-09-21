package com.dcsuibian.atelier.service.impl;

import com.dcsuibian.atelier.constant.UserConstants;
import com.dcsuibian.atelier.converter.PermissionConverter;
import com.dcsuibian.atelier.converter.RoleConverter;
import com.dcsuibian.atelier.domain.Permission;
import com.dcsuibian.atelier.domain.Role;
import com.dcsuibian.atelier.domain.User;
import com.dcsuibian.atelier.exception.BusinessException;
import com.dcsuibian.atelier.service.RbacService;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Table;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static com.dcsuibian.atelier.jooq.generated.Tables.PERMISSION;
import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE;
import static com.dcsuibian.atelier.jooq.generated.Tables.ROLE_PERMISSION;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER_ROLE;
import static com.dcsuibian.atelier.util.TransactionUtil.runAfterCommit;

@Service
public class RbacServiceImpl implements RbacService {

	/**
	 * 缓存 Key：atelier:users:{userId}:available-permission-codes，Redis Set，只存可用的权限码。
	 * 每个 Set 都带一个空字符串占位元素：空集合在 Redis 里存不住，不占位的话没有任何权限的用户会每次都回库。
	 */
	private static final String CACHE_PREFIX = "atelier:users:";
	private static final String CACHE_SUFFIX = ":available-permission-codes";
	private static final String CACHE_PLACEHOLDER = "";
	private static final Duration CACHE_TTL = Duration.ofMinutes(5);

	private final DSLContext dsl;
	private final RoleConverter roleConverter;
	private final PermissionConverter permissionConverter;
	private final StringRedisTemplate redisTemplate;

	@Autowired
	public RbacServiceImpl(DSLContext dsl, RoleConverter roleConverter, PermissionConverter permissionConverter, StringRedisTemplate redisTemplate) {
		this.dsl = dsl;
		this.roleConverter = roleConverter;
		this.permissionConverter = permissionConverter;
		this.redisTemplate = redisTemplate;
	}

	private static String cacheKey(long userId) {
		return CACHE_PREFIX + userId + CACHE_SUFFIX;
	}

	/**
	 * 按 id 引用的对象必须全部存在，否则抛 404
	 */
	private void requireAllExist(Table<?> table, Field<Long> idField, Collection<Long> ids, String message) {
		Set<Long> distinctIds = new HashSet<>(ids);
		if (!distinctIds.isEmpty() && dsl.fetchCount(table, idField.in(distinctIds)) != distinctIds.size()) {
			throw new BusinessException(message, 404);
		}
	}

	@Override
	@Transactional(readOnly = true)
	public List<Role> getRolesByUserId(long userId) {
		requireAllExist(USER, USER.ID, List.of(userId), "用户不存在");
		return dsl.select(ROLE.fields())
				.from(USER_ROLE)
				.join(ROLE).on(USER_ROLE.ROLE_ID.eq(ROLE.ID))
				.where(USER_ROLE.USER_ID.eq(userId))
				.orderBy(ROLE.ID.asc())
				.fetchInto(ROLE)
				.map(roleConverter::toDomain);
	}

	@Override
	@Transactional
	public void setRolesToUser(long userId, List<Long> roleIds) {
		requireAllExist(USER, USER.ID, List.of(userId), "用户不存在");
		requireAllExist(ROLE, ROLE.ID, roleIds, "角色不存在");
		dsl.deleteFrom(USER_ROLE).where(USER_ROLE.USER_ID.eq(userId)).execute();
		OffsetDateTime now = OffsetDateTime.now();
		for (Long roleId : new LinkedHashSet<>(roleIds)) {
			dsl.insertInto(USER_ROLE)
					.set(USER_ROLE.USER_ID, userId)
					.set(USER_ROLE.ROLE_ID, roleId)
					.set(USER_ROLE.CREATE_TIME, now)
					.execute();
		}
		evictAvailablePermissionCodes(userId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Permission> getPermissionsByRoleId(long roleId) {
		requireAllExist(ROLE, ROLE.ID, List.of(roleId), "角色不存在");
		return dsl.select(PERMISSION.fields())
				.from(ROLE_PERMISSION)
				.join(PERMISSION).on(ROLE_PERMISSION.PERMISSION_ID.eq(PERMISSION.ID))
				.where(ROLE_PERMISSION.ROLE_ID.eq(roleId))
				.orderBy(PERMISSION.ID.asc())
				.fetchInto(PERMISSION)
				.map(permissionConverter::toDomain);
	}

	@Override
	@Transactional
	public void setPermissionsToRole(long roleId, List<Long> permissionIds) {
		requireAllExist(ROLE, ROLE.ID, List.of(roleId), "角色不存在");
		requireAllExist(PERMISSION, PERMISSION.ID, permissionIds, "权限不存在");
		dsl.deleteFrom(ROLE_PERMISSION).where(ROLE_PERMISSION.ROLE_ID.eq(roleId)).execute();
		OffsetDateTime now = OffsetDateTime.now();
		for (Long permissionId : new LinkedHashSet<>(permissionIds)) {
			dsl.insertInto(ROLE_PERMISSION)
					.set(ROLE_PERMISSION.ROLE_ID, roleId)
					.set(ROLE_PERMISSION.PERMISSION_ID, permissionId)
					.set(ROLE_PERMISSION.CREATE_TIME, now)
					.execute();
		}
		// 拥有这个角色的用户可能很多，逐个清不如全清
		evictAllAvailablePermissionCodes();
	}

	@Override
	@Transactional(readOnly = true)
	public Set<String> getAvailablePermissionCodes(long userId) {
		String key = cacheKey(userId);
		Set<String> cached = redisTemplate.opsForSet().members(key);
		if (null != cached && !cached.isEmpty()) {
			Set<String> codes = new HashSet<>(cached);
			codes.remove(CACHE_PLACEHOLDER);
			return codes;
		}
		Set<String> codes = queryAvailablePermissionCodes(userId);
		writeCache(key, codes);
		return codes;
	}

	@Override
	@Transactional(readOnly = true)
	public List<Permission> getAvailablePermissions(long userId) {
		requireAllExist(USER, USER.ID, List.of(userId), "用户不存在");
		Set<String> codes = getAvailablePermissionCodes(userId);
		if (codes.isEmpty()) {
			return List.of();
		}
		return dsl.selectFrom(PERMISSION)
				.where(PERMISSION.CODE.in(codes))
				.orderBy(PERMISSION.ID.asc())
				.fetch(permissionConverter::toDomain);
	}

	/**
	 * 唯一计算「某人有哪些权限」的地方，超级管理员也只在这里特判
	 */
	private Set<String> queryAvailablePermissionCodes(long userId) {
		String enabled = Permission.Status.ENABLED.name();
		if (!dsl.fetchExists(USER, USER.ID.eq(userId).and(USER.STATUS.eq(User.Status.ENABLED.name())))) {
			return new HashSet<>();
		}
		if (UserConstants.SUPER_ADMIN_ID == userId) {
			return new HashSet<>(dsl.select(PERMISSION.CODE)
					.from(PERMISSION)
					.where(PERMISSION.STATUS.eq(enabled))
					.fetch(PERMISSION.CODE));
		}
		return new HashSet<>(dsl.selectDistinct(PERMISSION.CODE)
				.from(USER_ROLE)
				.join(ROLE).on(USER_ROLE.ROLE_ID.eq(ROLE.ID))
				.join(ROLE_PERMISSION).on(ROLE.ID.eq(ROLE_PERMISSION.ROLE_ID))
				.join(PERMISSION).on(ROLE_PERMISSION.PERMISSION_ID.eq(PERMISSION.ID))
				.where(USER_ROLE.USER_ID.eq(userId))
				.and(ROLE.STATUS.eq(Role.Status.ENABLED.name()))
				.and(PERMISSION.STATUS.eq(enabled))
				.fetch(PERMISSION.CODE));
	}

	/**
	 * 删旧键、写入、设过期放在一个 Redis 事务里，避免中途失败留下永不过期的键
	 */
	private void writeCache(String key, Set<String> codes) {
		String[] members = Stream.concat(Stream.of(CACHE_PLACEHOLDER), codes.stream()).toArray(String[]::new);
		redisTemplate.execute(new SessionCallback<List<Object>>() {
			@Override
			@SuppressWarnings("unchecked")
			public <K, V> List<Object> execute(RedisOperations<K, V> operations) {
				RedisOperations<String, String> stringOperations = (RedisOperations<String, String>) operations;
				stringOperations.multi();
				stringOperations.delete(key);
				stringOperations.opsForSet().add(key, members);
				stringOperations.expire(key, CACHE_TTL);
				return stringOperations.exec();
			}
		});
	}

	@Override
	public void evictAvailablePermissionCodes(long userId) {
		runAfterCommit(() -> redisTemplate.delete(cacheKey(userId)));
	}

	@Override
	public void evictAllAvailablePermissionCodes() {
		runAfterCommit(() -> {
			ScanOptions options = ScanOptions.scanOptions().match(CACHE_PREFIX + "*" + CACHE_SUFFIX).count(1000).build();
			List<String> keys = new ArrayList<>();
			try (Cursor<String> cursor = redisTemplate.scan(options)) {
				cursor.forEachRemaining(keys::add);
			}
			if (!keys.isEmpty()) {
				redisTemplate.delete(keys);
			}
		});
	}

}
