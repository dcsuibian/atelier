package com.dcsuibian.atelier.config;

import com.dcsuibian.atelier.IntegrationTests;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

public class JacksonConfigTests extends IntegrationTests {

	@Autowired
	JsonMapper jsonMapper;

	@Test
	@DisplayName("Instant 序列化为毫秒时间戳，并能反序列化回来")
	void instantSerializesAsEpochMillis() {
		Instant time = Instant.ofEpochMilli(5000L);
		String json = jsonMapper.writeValueAsString(time);
		assertThat(json).isEqualTo("5000");
		assertThat(jsonMapper.readValue(json, Instant.class)).isEqualTo(time);
	}

}
