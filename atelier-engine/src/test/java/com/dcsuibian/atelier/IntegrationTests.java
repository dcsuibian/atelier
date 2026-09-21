package com.dcsuibian.atelier;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;

/**
 * 集成测试基类：Testcontainers 起 PostgreSQL 与 Redis，所有子类共享同一个 Spring 上下文和容器。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class IntegrationTests {
}
