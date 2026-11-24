package com.dcsuibian.atelier.service;

import com.dcsuibian.atelier.domain.Project;
import com.dcsuibian.atelier.qo.ProjectQo;
import com.dcsuibian.atelier.vo.PageWrapper;

public interface ProjectService {

	PageWrapper<Project> get(ProjectQo qo, int pageNumber, int pageSize);

	Project getById(long id);

	Project add(Project project);

	/**
	 * 只更新非 null 的字段
	 */
	Project editPartially(Project project);

	void deleteById(long id);

}
