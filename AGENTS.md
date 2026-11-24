# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository.

## 硬约束：本仓库公开，内容必须脱敏

仓库托管在 GitHub 公开可见。**任何进入 Git 的内容都不得涉及任何公司、学校、组织、机构的信息**，包括但不限于：

- 名称、缩写、内部域名、镜像仓库地址、Git 服务器地址
- 内部服务名、仓库名、数据库名、表名中的专有名词
- 客户名、项目代号，以及能反推出具体业务领域的细节

约束范围覆盖**代码、注释、文档、配置、示例数据、测试夹具，以及 commit message**。需要举例时用通用业务概念（用户、角色、菜单、订单、设备），不要借用真实项目的业务模型。

同理，本仓库**不具名列出下游项目**——其中部分项目的名称本身即属上述信息。统称「下游项目」即可；面向读者的文档里写「基于它的项目」。

## 文档分工

- **`docs/`**：设计决策，写给人看——为什么这样做、哪些判断过不做、坑在哪。动手改某个领域之前，先读 README 索引里对应的那篇。本文件不重复其中的理由，只写操作层面的细节。
- **本文件**：命令、目录、具体文件与类名、只有动手时才用得上的坑。
- **代码注释**：贴着某段代码的理由。

新的决策先写成草稿 `docs/drafts/claude-<主题>.md`，作者审过后才移出 `drafts/`、按 `NNN、标题.md` 编号转正，并加进 README 的索引。写法：每条结论配理由，写清坑点和自然会冒出的反问；不举具体代码、不写备选方案与讨论过程、不写会过期的数值与状态；只是当前实现而非规定的，要注明。

## 上游：Art Design Pro

前端源自 [Art Design Pro](https://github.com/Daymychen/art-design-pro)（下称 ADP），现已降为参考，定位见 `docs/` 的「项目定位与上游」。

**当前对齐版本：v3.0.2（2026-03-15）。** 这是跟进 ADP 新版时的锚点，**每次同步后必须更新它**。

## 代码组织：ADP 原件与自有代码

- `art/` 下是 ADP 原件或在原件上改的：`components/art/`（按用途分 `layouts`、`forms`、`cards`、`charts`、`icons`、`tables` 等）、`composables/art/`、`styles/art/`、`utils/art/`、`types/art/`（只剩路由与系统配置的类型）
- 自有代码平铺：如 `components/app-layout/`、`components/chart-view/`、`composables/use-chart.ts`、`utils/http.ts`、`types/user.ts`（与后端对接的类型都在 `types/` 根上）
- 整体接管、不再区分原件的目录：`router/`、`stores/`、`apis/`、`directives/`、`config/`、`constants/`、`locales/`

几条命名规则：

- 子目录统一叫 `art/`，不用 `core`、`common` 这类不表达含义的名字。只装一个文件的目录去掉（组件与页面的 `目录/index.vue` 例外）；单复数按「一组同类个体用复数，被拆成模块的整体用单数」。目录不叫 ADP 的 `hooks`：那是 React 的叫法，Vue 官方叫 composables
- `art/` 下的原件保留原名（`useTheme.ts`、`SidebarSubmenu.vue` 这类 camelCase / PascalCase），改名会让逐文件对照失效。自有文件一律 kebab-case。组件名与 `art-` 前缀沿用 ADP

**`art/` 里的小改动标 `atelier：` 注释**，用 `rg -n 'atelier：' src` 能找全。格式化、`import type`、路径别名、`useUserStore()` 按内容改到 `settingStore` / `sessionStore` 这类机械改动不标，标了反而淹没真正的改动。需要多解释的两处：

- `types/art/router.ts` 的 `RouteMeta` 加了 `permission` 字段。这个类型被 `art/` 下的菜单组件大量引用，就地加一个字段比整个挪出来、逼着一堆文件改 import 更省事。
- `components/art/layouts/art-settings-panel/style.scss` 的 `:deep(.el-drawer__body)` 改为 `.setting-modal .el-drawer__body`。这个文件不是 scoped，`:deep` 本就不该出现；Vite 8 改用 lightningcss 后直接报错。只把 `:deep` 去掉会让所有抽屉都隐藏滚动条，所以限定在设置抽屉内。**下游自行升级 Vite 8 时多半只做了前者**，同步时要检查这一处。

`RouteMeta` 继承了 `Record<string | number | symbol, unknown>`，**路由 meta 里写错字段名永远不会报错**。

与 ADP 的目录差异，命名向下游看齐以便对照：

| ADP | atelier |
| --- | --- |
| `src/api/` | `src/apis/` |
| `src/store/` + `store/modules/` | `src/stores/`（平铺，无 `modules`） |
| `src/hooks/` | `src/composables/` |
| `src/enums/` | `src/constants/`（枚举写成 `as const` 对象） |
| `src/plugins/` | 无，图表组件各自按需注册 ECharts 模块 |
| `src/assets/styles/` | `src/styles/` |
| `src/components/core/` | `src/components/art/` |
| `src/types/{api,common,component,...}` | `src/types/art/`，组件专用的类型挪到了组件旁边 |
| `src/utils/{http,storage,ui,...}` | `src/utils/art/{...}` |
| `router/routes/asyncRoutes.ts` | `router/routes/dynamic-routes.ts`（导出名一并改为 `dynamicRoutes`） |
| `router/guards/beforeEach.ts`、`afterEach.ts` | `router/guards/before-each.ts`、`after-each.ts` |
| `router/routesAlias.ts` | `router/routes-alias.ts` |

ADP 的 `router/core/` 已拆散：`MenuProcessor`、`IframeRouteManager` 改名 kebab-case 挪到 `router/` 下，其余随按字符串加载组件一起删了。

## 跟进 ADP 时不要带回来的东西

理由见 `docs/` 对应的篇目，这里只是清单。

**工具链**：husky、lint-staged、commitizen、cz-git、commitlint、ESLint、Stylelint（连同 `eslint-config-prettier`、`eslint-plugin-prettier`）、`vite-plugin-vue-devtools`、`scripts/clean-dev.ts`（写死的路径已脱节，且会写回 ADP 的推广链接；它的演示内容清单可从 git 历史取回参考）。**Prettier 是保留的**，它是 formatter 不是 linter。

**演示内容**：判断标准是演示页面用完即弃，可复用组件留下。

- 删除的页面：`views/` 下的 article、change、examples、safeguard、template、widgets、dashboard/{analysis,ecommerce}、system/nested、system/menu
- 删除的组件：wangEditor、excel 导入导出、video、图片裁剪、地图、评论组件，以及聊天窗口、消息通知、节日烟花、升级提示、顶栏快速入口
- **统计卡片与图表组件全部保留**，哪怕只有演示页在引用
- 删页面时要连带过一遍：路由模块、`router/modules/index.ts`、i18n 的 menus 键、`env.d.ts` 的 declare module、`utils/art/index.ts` 的 re-export

**机制**：

- ADP 的 HTTP 层（`utils/art/http/`），换成 `utils/http.ts`
- `v-auth`、`v-roles` 指令，`meta.roles`、`info.buttons`；`src/directives/` 只剩 `ripple`
- userStore 这个杂物袋：语言、搜索历史、锁屏迁入 `settingStore`，会话归 `stores/session.ts`。锁屏存在偏好里，生命周期却跟着会话，登出时由 `session.reset()` 解除，拆分时容易漏掉
- `router/core/` 的编排层（`RouteRegistry`、角色过滤、`RoutePermissionValidator`）
- 后端路由模式与按字符串加载组件（`ComponentLoader`）；`AppRouteRecord.component` 不再接受字符串。布局外壳在 `components/app-layout/`
- `useTable` 及配套（`useTableColumns`、`utils/art/table/`、`Api.Common`、`ArtTableHeader`），表格页以用户管理页为准
- 自动导入插件（`unplugin-auto-import`、`unplugin-vue-components`、`unplugin-element-plus`）
- `useChart` 与 `plugins/echarts.ts`，换成 vue-echarts 加自有的 `ChartView`；`composables/use-chart.ts` 只剩按明暗主题生成样式的函数
- `useAuth`、`useCommon`

**配置**：

- Prettier 用自有的 `.prettierrc.json`（带 `$schema`），只写与默认不同的项，与 helix-ui 一致
- tsconfig 拆成 project references（`tsconfig.app.json` / `tsconfig.node.json`），基础配置取自 `@vue/tsconfig` 与 `@tsconfig/node24`
- `.gitignore` 以 Vite 官方模板为底；`.vscode/` 与 helix-ui 一致
- 路径别名只保留 `@`。`@plugins` 只存在于 ADP 的 tsconfig，`vite.config.ts` 里从来没有，用了会 TS 不报错但构建失败
- 打包配置：不写等同默认值的 `target`/`outDir`，`minify` 用默认的 esbuild，不要 terser，gzip 交给部署层，不要 `VITE_DROP_CONSOLE`
- 类型声明优先用 `@types/*` 包，`env.d.ts` 只留 `vite/client` 引用和全局变量声明
- ADP 的 `README`、`CHANGELOG` 已删除；`index.html` 补了 `<html lang="zh-CN">`，favicon 走 `public/`

**`atelier-ui/LICENSE` 必须保留**：清理上游痕迹时最容易误删。

**尚未清理的上游痕迹**：`src/utils/art/constants.ts` 里的常量全指向 ADP（GitHub、文档站、社区、作者的 B 站），被 `dashboard/console/modules/about-project.vue` 和 `art-header-bar/widget/ArtUserMenu.vue` 引用；`index.html` 的 `<title>` 和 description 也还是上游的。**有意留着**，等决定好要显示什么再一起换。

## 仓库构成

两个子项目，各自独立，没有根级别的构建配置。技术栈与作者的个人项目 helix（`github.com/dcsuibian/helix`）一致，其 `CLAUDE.md` 里的后端分层与接口约定可作参考。

- `atelier-ui/`：Vue 3 + TypeScript + Vite + Element Plus，pnpm 管理，Node.js v24.11.1（fnm）
- `atelier-engine/`：Java 25 + Spring Boot 4 + jOOQ + Flyway + PostgreSQL + Redis，Testcontainers 测试，`mvnd` 构建，包名 `com.dcsuibian.atelier`

下游项目多为独立仓库、前端目录即仓库根，所以子项目各自带一份完整的 `.gitignore`、`.gitattributes`，能兼顾时兼顾。仓库根的 `.gitignore` 忽略 `node_modules/`、`dist/`、`target/` 作为防御。**包管理和构建命令一律在对应子项目目录内执行**。

**推 `main` 即上线。** `.github/workflows/` 按子项目路径分别触发，构建镜像推到 GHCR，再通知服务器更新在线 demo。日常在 `dev` 上开发，上线时把 `main` 快进到 `dev` 再推送。

## 命令

### atelier-ui（在该目录下执行）

- `pnpm dev`：启动开发服务器
- `pnpm build`：并行跑 type-check 与 vite build
- `pnpm build:analyze`：构建并输出体积分析到 `dist/stats.html`
- `pnpm type-check`：`vue-tsc --build`
- `pnpm serve`：预览构建产物
- `pnpm format`：Prettier 格式化，**范围仅 `src/` 与 `tests/`**
- `pnpm test`：vitest，配置在独立的 `vitest.config.ts`。测试放 `tests/`，目录结构对照 `src`

开发环境前端跑在 **32732**，后端 `development` 跑在 **32733**。前端请求带 `/api` 前缀，由 vite 代理 rewrite 掉——后端没有 context-path，接口路径就是 `/session`、`/users`，前缀属于部署层的事。端口取值区间是 **10000–49151**：Windows 的动态端口从 49152 起，WSL2 与 Hyper-V 的保留块都从那里面划。

**部署**：`Dockerfile` 两阶段构建，产物交给 nginx。镜像里只跑 `build-only`，不跑 type-check。路由用 history 模式，nginx 把所有路径回落到 `index.html`；`/api` 的反代由外层负责。

### atelier-engine（在该目录下执行）

- `mvnd test`：运行测试，Testcontainers 自动起 PostgreSQL 与 Redis，需要 Docker
- `mvnd test-compile exec:java`：重新生成 jOOQ 代码，输出到 `jooq/generated/`。**改完迁移脚本后执行，生成结果一起提交**

**部署**：`Dockerfile` 以 `production` profile 启动，需要的环境变量见 `application-production.yml`。

`BIGSERIAL` 不是标准 IDENTITY 列，jOOQ 不会自动识别。`JooqCodegen` 把所有表的 `id` 列声明为合成自增列；若某张表的 `id` 由应用层赋值，需要在那里排除。

测试与代码生成共用 `TestcontainersConfiguration.POSTGRES_IMAGE`。镜像固定到小版本。刻意不带扩展；下游需要 PostGIS 或 TimescaleDB 时换成对应镜像（如 `timescale/timescaledb-ha` 的 `pg16.14-ts2.29.2` 这种连扩展版本一起写死的标签），并加 `.asCompatibleSubstituteFor("postgres")`。

## 代码约定

### atelier-ui

决策与理由见 `docs/` 的「前端构建与依赖」「前端写法」「会话与权限」。动手时要注意的：

- **类型导入一律 type-only**（`verbatimModuleSyntax` 已开启）。整条都是类型时写 `import type { X } from '...'`；与值混在一条时用内联 `import { type X, y } from '...'`，保持单行不拆分。
- **一律显式 import**。全局可用的只有 `RouterView` / `RouterLink` 和 `main.ts` 里注册的 `v-ripple`；Element Plus 的 `v-loading` 也要 import `vLoading`。
- **路径**：引用全局的东西用 `@/`，只在一块内部共享的（如某个组件目录下的 composables、几个页面共用的模块）用相对路径。不要新增其它别名。
- **递归类型用对象，别用元组。** 自引用的元组一旦进了 `RouteMeta`，模板推导路由对象时会撞上 `TS2589: Type instantiation is excessively deep`；对象的自引用是惰性解析的，不会触发。
- **别用 `<!-- @vue-ignore -->` 压 TS2589**：那个元素上所有表达式会一起失去检查，治本是让类型推导得动。
- **i18n**：`zh.json` 与 `en.json` 的键保持一致，AI 写的要把英文一并补上。脚本里用 `useI18n()` 的 `t`，组件外用 `@/locales` 导出的 `$t`。
- **会话与权限**：
  - `stores/session.ts` 是登录态的唯一出口（`user`、`isLoggedIn`、`ensureLoaded()`、`login()`、`logout()`），权限由它统一编排，别在别处单独填或清 permission store。
  - 权限码集中在 `constants/permission.ts`，一律引用 `PERMISSIONS.XXX`。按钮级判断写 `v-if="permissionStore.check(...)"`，与路由守卫共用。
  - `PermissionExpression` 只有 and / or。路由由 `filterByPermission(dynamicRoutes)` 筛完才注册。
  - 401 在 `utils/http.ts` 统一处理，取 session store 要用**动态 `import`**：session store 经 `apis/` 绕回 `utils/http.ts`，静态引用会成环。`GET /session` 未登录时返回 200，守卫的 `ensureLoaded()` 不受 401 处理影响。
  - 并发去重（会话加载、401 登出）用进行中的 Promise。

### atelier-engine

决策与理由见 `docs/` 的「接口约定」「后端约定」。动手时要注意的：

- 响应用 `ResponseWrapper { code, message, result, timestamp }`，分页用 `PageWrapper { data, total, pageNumber, pageSize }`。时间序列化在 `JacksonConfig`。
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

- 注册页与忘记密码页后端没有对应接口，链接指向死路，**有意留着作参考**，不要顺手删。
- 后端只做了认证拦截，没做按权限码的授权拦截，由下游按场景补。
- 图标经 `@iconify/vue` 运行时从 Iconify 的在线服务加载，模板不做离线化，由下游按部署环境决定。断网时图标只会变成空白、不报错；要离线就启用 `utils/art/ui/iconify-loader.ts`，把用到的图标集打包注册。
- `useHeaderBar`、`useLayoutHeight`、`useTableHeight` 只有 1～3 处引用，不单独处理，随对应功能的去留走。
- ADP 演示页（工作台、个人中心、注册、忘记密码）里仍有写死的中文与演示数据，随这些页面的去留一起处理。
