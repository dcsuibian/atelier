package com.dcsuibian.atelier.converter;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.OffsetDateTime;

/**
 * MapStruct 没有内置的类型转换。jOOQ 把 TIMESTAMPTZ 生成为 OffsetDateTime，领域模型统一用 Instant
 */
@Component
public class CommonConverter {

	public Instant offsetDateTimeToInstant(OffsetDateTime offsetDateTime) {
		return null == offsetDateTime ? null : offsetDateTime.toInstant();
	}

}
