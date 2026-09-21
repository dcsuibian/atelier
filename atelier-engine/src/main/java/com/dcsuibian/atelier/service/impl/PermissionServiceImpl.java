package com.dcsuibian.atelier.service.impl;

import com.dcsuibian.atelier.converter.PermissionConverter;
import com.dcsuibian.atelier.domain.Permission;
import com.dcsuibian.atelier.qo.PermissionQo;
import com.dcsuibian.atelier.service.PermissionService;
import com.dcsuibian.atelier.service.RbacService;
import com.dcsuibian.atelier.vo.PageWrapper;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static com.dcsuibian.atelier.jooq.generated.Tables.PERMISSION;

@Slf4j
@Service
public class PermissionServiceImpl implements PermissionService {

	private static final String DEFINITION_FILE = "permissions.yml";

	private final DSLContext dsl;
	private final PermissionConverter converter;
	private final RbacService rbacService;

	@Autowired
	public PermissionServiceImpl(DSLContext dsl, PermissionConverter converter, RbacService rbacService) {
		this.dsl = dsl;
		this.converter = converter;
		this.rbacService = rbacService;
	}

	private Condition buildCondition(PermissionQo qo) {
		Condition condition = DSL.noCondition();
		if (null != qo.getStatus()) {
			condition = condition.and(PERMISSION.STATUS.eq(qo.getStatus().name()));
		}
		if (null != qo.getSearchText() && !qo.getSearchText().isBlank()) {
			String text = qo.getSearchText();
			condition = condition.and(PERMISSION.CODE.containsIgnoreCase(text)
					.or(PERMISSION.NAME.containsIgnoreCase(text))
					.or(PERMISSION.DESCRIPTION.containsIgnoreCase(text)));
		}
		return condition;
	}

	@Override
	@Transactional(readOnly = true)
	public PageWrapper<Permission> get(PermissionQo qo, int pageNumber, int pageSize) {
		Condition condition = buildCondition(qo);
		long total = dsl.fetchCount(PERMISSION, condition);
		List<Permission> permissions = dsl.selectFrom(PERMISSION)
				.where(condition)
				.orderBy(PERMISSION.ID.asc())
				.limit(pageSize)
				.offset((long) (pageNumber - 1) * pageSize)
				.fetch(converter::toDomain);
		return PageWrapper.of(permissions, total, pageNumber, pageSize);
	}

	private record Definition(String code, String name, String description, boolean enabled) {
	}

	@SuppressWarnings("unchecked")
	private static List<Definition> loadDefinitions() {
		try (InputStream inputStream = PermissionServiceImpl.class.getClassLoader().getResourceAsStream(DEFINITION_FILE)) {
			if (null == inputStream) {
				throw new IllegalStateException("未找到权限定义文件 " + DEFINITION_FILE);
			}
			Map<String, List<Map<String, Object>>> data = new Yaml().load(inputStream);
			return data.get("permissions").stream().map(item -> {
				Definition definition = new Definition(
						(String) item.get("code"),
						(String) item.get("name"),
						(String) item.get("description"),
						Boolean.TRUE.equals(item.get("enabled"))
				);
				if (Stream.of(definition.code(), definition.name(), definition.description()).anyMatch(s -> null == s || s.isBlank())) {
					throw new IllegalStateException("权限定义缺少 code、name 或 description：" + item);
				}
				return definition;
			}).toList();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	@Override
	@Transactional
	public void sync() {
		List<Definition> definitions = loadDefinitions();
		OffsetDateTime now = OffsetDateTime.now();
		for (Definition definition : definitions) {
			String status = (definition.enabled() ? Permission.Status.ENABLED : Permission.Status.DISABLED).name();
			// 只在内容确有变化时才更新，免得每次启动都刷新 update_time
			dsl.insertInto(PERMISSION)
					.set(PERMISSION.CODE, definition.code())
					.set(PERMISSION.NAME, definition.name())
					.set(PERMISSION.DESCRIPTION, definition.description())
					.set(PERMISSION.STATUS, status)
					.set(PERMISSION.CREATE_TIME, now)
					.set(PERMISSION.UPDATE_TIME, now)
					.onConflict(PERMISSION.CODE)
					.doUpdate()
					.set(PERMISSION.NAME, DSL.excluded(PERMISSION.NAME))
					.set(PERMISSION.DESCRIPTION, DSL.excluded(PERMISSION.DESCRIPTION))
					.set(PERMISSION.STATUS, DSL.excluded(PERMISSION.STATUS))
					.set(PERMISSION.UPDATE_TIME, now)
					.where(PERMISSION.NAME.ne(DSL.excluded(PERMISSION.NAME))
							.or(PERMISSION.DESCRIPTION.ne(DSL.excluded(PERMISSION.DESCRIPTION)))
							.or(PERMISSION.STATUS.ne(DSL.excluded(PERMISSION.STATUS))))
					.execute();
		}
		int disabled = dsl.update(PERMISSION)
				.set(PERMISSION.STATUS, Permission.Status.DISABLED.name())
				.set(PERMISSION.UPDATE_TIME, now)
				.where(PERMISSION.CODE.notIn(definitions.stream().map(Definition::code).toList()))
				.and(PERMISSION.STATUS.ne(Permission.Status.DISABLED.name()))
				.execute();
		if (disabled > 0) {
			log.warn("{} 个权限已从 {} 中移除，置为禁用", disabled, DEFINITION_FILE);
		}
		rbacService.evictAllAvailablePermissionCodes();
	}

}
