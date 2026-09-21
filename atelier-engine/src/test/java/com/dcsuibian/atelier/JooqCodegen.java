package com.dcsuibian.atelier;

import org.flywaydb.core.Flyway;
import org.jooq.codegen.GenerationTool;
import org.jooq.meta.jaxb.Configuration;
import org.jooq.meta.jaxb.Database;
import org.jooq.meta.jaxb.Generate;
import org.jooq.meta.jaxb.Generator;
import org.jooq.meta.jaxb.Jdbc;
import org.jooq.meta.jaxb.SyntheticIdentityType;
import org.jooq.meta.jaxb.SyntheticObjectsType;
import org.jooq.meta.jaxb.Target;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.nio.file.Path;

/**
 * 生成 jOOQ 代码：起一个临时 PostgreSQL 容器，跑完 Flyway 迁移后从中读取表结构。
 * <p>
 * 改完迁移脚本后手动执行 {@code ./mvnw test-compile exec:java}，生成结果提交进版本库，
 * 这样普通构建（包括镜像构建）不依赖 Docker。
 */
public class JooqCodegen {

	public static void main(String[] args) throws Exception {
		try (PostgreSQLContainer postgres = new PostgreSQLContainer(TestcontainersConfiguration.POSTGRES_IMAGE)) {
			postgres.start();
			Flyway.configure()
					.dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
					.load()
					.migrate();
			GenerationTool.generate(configuration(postgres));
		}
	}

	private static Configuration configuration(PostgreSQLContainer postgres) throws Exception {
		return new Configuration()
				.withJdbc(new Jdbc()
						.withDriver(postgres.getDriverClassName())
						.withUrl(postgres.getJdbcUrl())
						.withUser(postgres.getUsername())
						.withPassword(postgres.getPassword()))
				.withGenerator(new Generator()
						.withDatabase(new Database()
								.withName("org.jooq.meta.postgres.PostgresDatabase")
								.withInputSchema("public")
								.withExcludes("flyway_schema_history")
								.withIncludeRoutines(false)
								// BIGSERIAL 不是标准 IDENTITY 列，jOOQ 不会自动识别，不声明的话插入后拿不到自增 id
								.withSyntheticObjects(new SyntheticObjectsType()
										.withIdentities(new SyntheticIdentityType().withFields("id"))))
						.withTarget(new Target()
								.withPackageName("com.dcsuibian.atelier.jooq.generated")
								.withDirectory(projectDirectory().resolve("src/main/java").toString()))
						.withGenerate(new Generate()
								.withJavaTimeTypes(true)
								.withRoutines(false)
								.withIndexes(false)
								.withKeys(false)));
	}

	/**
	 * 从 target/test-classes 往上两级定位项目根目录，不依赖启动时的工作目录
	 */
	private static Path projectDirectory() throws Exception {
		return Path.of(JooqCodegen.class.getProtectionDomain().getCodeSource().getLocation().toURI())
				.getParent()
				.getParent();
	}

}
