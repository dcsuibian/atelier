package com.dcsuibian.atelier.service.impl;

import com.dcsuibian.atelier.converter.ProjectConverter;
import com.dcsuibian.atelier.domain.Project;
import com.dcsuibian.atelier.domain.User;
import com.dcsuibian.atelier.exception.BusinessException;
import com.dcsuibian.atelier.jooq.generated.tables.records.ProjectRecord;
import com.dcsuibian.atelier.qo.ProjectQo;
import com.dcsuibian.atelier.service.ProjectService;
import com.dcsuibian.atelier.vo.PageWrapper;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.SelectOnConditionStep;
import org.jooq.UpdateSetMoreStep;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

import static com.dcsuibian.atelier.jooq.generated.Tables.PROJECT;
import static com.dcsuibian.atelier.jooq.generated.Tables.USER;

@Service
public class ProjectServiceImpl implements ProjectService {

	private final DSLContext dsl;
	private final ProjectConverter converter;

	@Autowired
	public ProjectServiceImpl(DSLContext dsl, ProjectConverter converter) {
		this.dsl = dsl;
		this.converter = converter;
	}

	/**
	 * 项目连同负责人的用户名、真实姓名一起查
	 */
	private SelectOnConditionStep<Record> selectWithOwner() {
		return dsl.select(PROJECT.asterisk(), USER.NAME, USER.REAL_NAME)
				.from(PROJECT)
				.join(USER).on(USER.ID.eq(PROJECT.OWNER_ID));
	}

	private Project toDomain(Record record) {
		Project project = converter.toDomain(record.into(PROJECT));
		User owner = new User();
		owner.setId(record.get(PROJECT.OWNER_ID));
		owner.setName(record.get(USER.NAME));
		owner.setRealName(record.get(USER.REAL_NAME));
		project.setOwner(owner);
		return project;
	}

	/**
	 * 负责人只认 id。传了负责人就要求这个用户存在
	 */
	private Long checkOwner(Project project) {
		if (null == project.getOwner()) {
			return null;
		}
		Long ownerId = project.getOwner().getId();
		if (null == ownerId) {
			throw new BusinessException("负责人不能为空");
		}
		if (!dsl.fetchExists(USER, USER.ID.eq(ownerId))) {
			throw new BusinessException("负责人不存在");
		}
		return ownerId;
	}

	private Condition buildCondition(ProjectQo qo) {
		Condition condition = DSL.noCondition();
		if (null != qo.getOwnerId()) {
			condition = condition.and(PROJECT.OWNER_ID.eq(qo.getOwnerId()));
		}
		if (null != qo.getSearchText() && !qo.getSearchText().isBlank()) {
			String text = qo.getSearchText();
			condition = condition.and(PROJECT.NAME.containsIgnoreCase(text).or(PROJECT.DESCRIPTION.containsIgnoreCase(text)));
		}
		return condition;
	}

	@Override
	@Transactional(readOnly = true)
	public PageWrapper<Project> get(ProjectQo qo, int pageNumber, int pageSize) {
		Condition condition = buildCondition(qo);
		long total = dsl.fetchCount(PROJECT, condition);
		List<Project> projects = selectWithOwner()
				.where(condition)
				.orderBy(PROJECT.ID.desc())
				.limit(pageSize)
				.offset((long) (pageNumber - 1) * pageSize)
				.fetch(this::toDomain);
		return PageWrapper.of(projects, total, pageNumber, pageSize);
	}

	@Override
	@Transactional(readOnly = true)
	public Project getById(long id) {
		Record record = selectWithOwner().where(PROJECT.ID.eq(id)).fetchOne();
		if (null == record) {
			throw new BusinessException("项目不存在", 404);
		}
		return toDomain(record);
	}

	@Override
	@Transactional
	public Project add(Project project) {
		Long ownerId = checkOwner(project);
		OffsetDateTime now = OffsetDateTime.now();
		ProjectRecord record = dsl.insertInto(PROJECT)
				.set(PROJECT.NAME, project.getName())
				.set(PROJECT.OWNER_ID, ownerId)
				.set(PROJECT.DESCRIPTION, project.getDescription())
				.set(PROJECT.CREATE_TIME, now)
				.set(PROJECT.UPDATE_TIME, now)
				.returning()
				.fetchOne();
		return getById(record.getId());
	}

	@Override
	@Transactional
	public Project editPartially(Project project) {
		Long ownerId = checkOwner(project);
		UpdateSetMoreStep<ProjectRecord> update = dsl.update(PROJECT).set(PROJECT.UPDATE_TIME, OffsetDateTime.now());
		if (null != project.getName()) {
			update = update.set(PROJECT.NAME, project.getName());
		}
		if (null != ownerId) {
			update = update.set(PROJECT.OWNER_ID, ownerId);
		}
		if (null != project.getDescription()) {
			update = update.set(PROJECT.DESCRIPTION, project.getDescription());
		}
		if (0 == update.where(PROJECT.ID.eq(project.getId())).execute()) {
			throw new BusinessException("项目不存在", 404);
		}
		return getById(project.getId());
	}

	@Override
	@Transactional
	public void deleteById(long id) {
		if (0 == dsl.deleteFrom(PROJECT).where(PROJECT.ID.eq(id)).execute()) {
			throw new BusinessException("项目不存在", 404);
		}
	}

}
