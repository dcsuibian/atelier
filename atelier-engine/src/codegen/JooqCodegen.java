import org.flywaydb.core.Flyway;
import org.jooq.codegen.GenerationTool;
import org.jooq.meta.jaxb.Configuration;
import org.jooq.meta.jaxb.Jdbc;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;

/**
 * 重新生成 jOOQ 类：用 Testcontainers 起临时 PG，跑完 Flyway 迁移，再按 jOOQ 配置生成代码，最后销毁容器。
 * <p>
 * 以源文件方式运行（{@code java JooqCodegen.java}），不需要先编译项目，所以项目代码编译不过时也能生成。
 * 入口是 pom 里的 {@code mvnd exec:exec@jooq-codegen}，项目之间的差异全部由系统属性传入，本文件可以原样复用：
 * <ul>
 *     <li>{@code codegen.image}：PG 镜像，必填</li>
 *     <li>{@code codegen.locations}：Flyway 迁移位置，逗号分隔，必填</li>
 *     <li>{@code codegen.config}：jOOQ 配置文件，默认 {@code src/codegen/jooq-codegen.xml}</li>
 *     <li>{@code codegen.command}：容器启动命令，空格分隔，选填（如 {@code postgres -c timescaledb.license=apache}）</li>
 *     <li>{@code codegen.initScript}：迁移前执行的 SQL 文件（如建扩展），选填</li>
 * </ul>
 */
public class JooqCodegen {

	public static void main(String[] args) throws Exception {
		String image = required("codegen.image");
		String[] locations = required("codegen.locations").split(",");
		Path config = Path.of(System.getProperty("codegen.config", "src/codegen/jooq-codegen.xml"));
		String command = System.getProperty("codegen.command", "");
		String initScript = System.getProperty("codegen.initScript", "");

		try (PostgreSQLContainer postgres = new PostgreSQLContainer(
				DockerImageName.parse(image).asCompatibleSubstituteFor("postgres"))) {
			if (!command.isBlank()) {
				postgres.withCommand(command.trim().split("\\s+"));
			}
			postgres.start();

			if (!initScript.isBlank()) {
				try (Connection connection = DriverManager.getConnection(
						postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())) {
					connection.createStatement().execute(Files.readString(Path.of(initScript)));
				}
			}

			Flyway.configure()
					.dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
					.locations(locations)
					.load()
					.migrate();

			Configuration configuration;
			try (InputStream in = Files.newInputStream(config)) {
				configuration = GenerationTool.load(in);
			}
			configuration.setJdbc(new Jdbc()
					.withUrl(postgres.getJdbcUrl())
					.withUser(postgres.getUsername())
					.withPassword(postgres.getPassword()));
			GenerationTool.generate(configuration);
		}
	}

	private static String required(String name) {
		String value = System.getProperty(name);
		if (null == value || value.isBlank()) {
			throw new IllegalArgumentException("缺少系统属性 " + name);
		}
		return value;
	}
}
