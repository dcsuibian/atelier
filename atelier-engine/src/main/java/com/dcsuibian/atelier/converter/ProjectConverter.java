package com.dcsuibian.atelier.converter;

import com.dcsuibian.atelier.domain.Project;
import com.dcsuibian.atelier.jooq.generated.tables.records.ProjectRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = CommonConverter.class)
public interface ProjectConverter {

	/**
	 * 负责人由 service 联表查出后另行填入
	 */
	@Mapping(target = "owner", ignore = true)
	Project toDomain(ProjectRecord record);

}
