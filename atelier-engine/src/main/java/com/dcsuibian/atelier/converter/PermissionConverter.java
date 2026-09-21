package com.dcsuibian.atelier.converter;

import com.dcsuibian.atelier.domain.Permission;
import com.dcsuibian.atelier.jooq.generated.tables.records.PermissionRecord;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = CommonConverter.class)
public interface PermissionConverter {

	Permission toDomain(PermissionRecord record);

}
