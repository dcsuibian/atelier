package com.dcsuibian.atelier.converter;

import com.dcsuibian.atelier.domain.User;
import com.dcsuibian.atelier.jooq.generated.tables.records.UserRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = CommonConverter.class)
public interface UserConverter {

	/**
	 * 不带出密码哈希。枚举按名字与字符串互转，MapStruct 默认即如此
	 */
	@Mapping(target = "password", ignore = true)
	User toDomain(UserRecord record);

}
