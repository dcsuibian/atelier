# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this directory.

atelier 的后端。仓库层面的约束（公开仓库须脱敏、文档分工）见仓库根的 `AGENTS.md`，设计理由见根目录 `docs/`。

## 命令

技术栈：Java 25 + Spring Boot 4 + jOOQ + Flyway + PostgreSQL + Redis，Testcontainers 测试，`mvnd` 构建，包名 `com.dcsuibian.atelier`。

- `mvnd test`：运行测试，Testcontainers 自动起 PostgreSQL 与 Redis，需要 Docker
- `mvnd exec:exec@jooq-codegen`：重新生成 jOOQ 代码，输出到 `src/main/java/.../jooq/generated/`，生成结果一起提交

**加表的顺序**：写 Flyway 迁移 → 把表名加进 `src/codegen/jooq-codegen.xml` 的 `<includes>`（id 由数据库自增的，同时加进 `<syntheticObjects>` 的 identities）→ 跑生成 → 再写引用新表的代码。`src/codegen/JooqCodegen.java` 按源文件运行，不需要项目先编译通过，改列导致代码报错时照样能生成。漏加 identities 不会报错，只是插入后拿不到自增 id。

开发环境用 `development` profile，跑在 **32733**。

**部署**：`Dockerfile` 以 `production` profile 启动，需要的环境变量见 `application-production.yml`。

测试用 `TestcontainersConfiguration.POSTGRES_IMAGE`，代码生成用 `pom.xml` 里 `jooq-codegen` 的 `codegen.image`，两处要一致。镜像固定到小版本。刻意不带扩展；下游需要 PostGIS 或 TimescaleDB 时换成对应镜像（如 `timescale/timescaledb-ha` 的 `pg16.14-ts2.29.2` 这种连扩展版本一起写死的标签），测试里加 `.asCompatibleSubstituteFor("postgres")`，代码生成需要建扩展时用 `codegen.initScript`。

## 代码约定

决策与理由见 `docs/` 的「接口约定」「后端约定」。动手时要注意的：

- 响应用 `ResponseWrapper { code, message, result, timestamp }`，分页用 `PageWrapper { data, total, pageNumber, pageSize }`。时间序列化在 `JacksonConfig`。
- 同一路径既要分页又要全量时，写两个方法，用 `@GetMapping(params = "pageNumber")` 与 `@GetMapping(params = "!pageNumber")` 区分（见 `PermissionController`）。只看 `pageNumber`：只给页码不给每页数量时报缺少参数，而不是落到全量查询。
- BCrypt 上限 72 字节，按字节数校验，超了返回 400。领域模型的 `password` 标注 `WRITE_ONLY`。
- **权限点**写在 `permissions.yml`，由 `DataInitializer` 每次启动同步。**超级管理员**固定为 id 1，初始密码取 `atelier.super-admin.initial-password`，生产环境对应环境变量 `ATELIER_PASSWORD`。
- 计算「某人有哪些权限」的逻辑只在 `RbacServiceImpl` 一处。权限缓存的清理要等事务提交后（`TransactionUtil.runAfterCommit`）。
- 会话：Spring Session 存在 Redis，会话 id 走 Cookie，会话里只存 `userId` 和 `loginTime`，登录时更换会话 id。
- `AuthenticationInterceptor` 只认会话里的 `userId`，缺了就抛 `UnauthenticatedException`，由 `GlobalExceptionHandler` 出 401。放行的只有 `/session`：GET 用来判断登录态，POST 是登录，DELETE 放行是为了让会话过期后登出仍调得动。
- **集成测试继承 `IntegrationTests`**，共用一个 Spring 上下文和一套容器，不要另加 `@MockitoBean` 之类会改变上下文的注解。
  - 基类给 MockMvc 配了 `defaultRequest`，**所有请求默认带一个已登录的会话**。认证由 `AuthenticationInterceptorTests` 集中验证，要测未登录的行为就加 `.with(anonymous())`。
  - 默认会话必须**经 `SessionRepository` 真造一个、再按 Cookie 传**：Spring Session 的 filter 只认 Cookie 里的会话 id，请求上预设的 `MockHttpSession` 它根本不看。
  - `SessionControllerTests` 里发起登录的请求要显式 `.with(anonymous())`，否则会复用默认会话，`changeSessionId()` 和登出会把它的 id 和 `userId` 一起改掉，后面的测试全挂。

## 现状与待办

- 只做了认证拦截，没做按权限码的授权拦截，由下游按场景补。
