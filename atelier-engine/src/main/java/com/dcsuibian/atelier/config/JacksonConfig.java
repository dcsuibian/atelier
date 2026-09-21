package com.dcsuibian.atelier.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.cfg.DateTimeFeature;

/**
 * 时间一律以毫秒时间戳传输，时区交给前端按用户所在地展示
 */
@Configuration
public class JacksonConfig {

	@Bean
	public JsonMapperBuilderCustomizer jsonMapperBuilderCustomizer() {
		return builder -> builder
				.enable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS)
				.disable(DateTimeFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS)
				.disable(DateTimeFeature.READ_DATE_TIMESTAMPS_AS_NANOSECONDS);
	}

}
