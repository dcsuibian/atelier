package com.dcsuibian.atelier.converter;

import com.dcsuibian.atelier.domain.Role;
import com.dcsuibian.atelier.jooq.generated.tables.records.RoleRecord;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = CommonConverter.class)
public interface RoleConverter {

	Role toDomain(RoleRecord record);

}
