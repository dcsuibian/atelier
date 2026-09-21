# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 硬约束：本仓库公开，内容必须脱敏

仓库托管在 GitHub 公开可见。**任何进入 Git 的内容都不得涉及任何公司、学校、组织、机构的信息**，包括但不限于：

- 名称、缩写、内部域名、镜像仓库地址、Git 服务器地址
- 内部服务名、仓库名、数据库名、表名中的专有名词
- 客户名、项目代号，以及能反推出具体业务领域的细节

约束范围覆盖**代码、注释、文档、配置、示例数据、测试夹具，以及 commit message**。需要举例时用通用业务概念（用户、角色、菜单、订单、设备），不要借用真实项目的业务模型。

同理，本仓库**不具名列出下游项目**——其中部分项目的名称本身即属上述信息。统称「下游项目」即可。

## 项目定位

Atelier 是一个**模板项目**，不是可复用的库。它为作者维护的多个后台管理系统提供统一基准：把「认为对的写法」沉淀在这里，下游项目需要同步时，与 atelier 做 diff，人工加 AI 判断哪些该搬、哪些因项目差异保留。

几个已经定下来的判断，改动方案前先理解：

- **刻意不做成 npm 包。** 前端模板共享的形式上就不适合库化——库路线要求接口稳定、发版、下游升级版本；模板路线接受重复代码，换取每个下游项目完全的自主权。库化只适合小而独立的功能点。
- **下游没有共同的 git 祖先**，各自魔改后已经彼此发散。同步手段只能是**对照 diff**，不是 `git merge`。因此代码组织要便于逐文件肉眼和 AI 对比：目录结构、文件命名、文件内顺序尽量与下游可对齐，不要自行另搞一套更优雅的组织。
- **公开 ≠ 开源。** 不做宣传、不接外部贡献，因此不需要 CONTRIBUTING、issue/PR 模板、CI 徽章，也不承诺语义化版本或向后兼容。文档可以写得很私人。已附 MIT LICENSE。

## 上游：Art Design Pro

前端源自 [Art Design Pro](https://github.com/Daymychen/art-design-pro)（下称 ADP）。**当前对齐版本：v3.0.2（2026-03-15）**。

同步链条是两段的，两段都靠锚点维持增量：

```
ADP ──(1)──> atelier ──(2)──> 下游项目
```

- **第 (1) 段**：ADP 发新版时，只需消化 ADP 自身的版本间 diff，不必重新做 atelier 与 ADP 的全量对比。前提是上面那行「当前对齐版本」始终准确——**每次同步后必须更新它**，锚点一旦含糊，就会退化成全量对比。
- **第 (2) 段**：同理，下游只需消化 atelier 的增量。因此 atelier **需要打 tag**，让下游有可引用的锚点；这不是为了外部使用者，是为了下游项目自己。

做 atelier 的动机在于：ADP 在视觉和完成度上做得很好，但程序风格与作者偏好不符。前端改动若牵涉接口设计，分歧会一路体现到后端。

## 代码组织：上游与自有分离

**ADP 的原件待在子目录里，自有代码平铺在该目录根上。** 这是 `atelier-ui` 最重要的组织约定，后续所有改动都以它为前提。

子目录叫什么看情况：ADP 本来就分了 `core/` 的（`components/`、`hooks/`、`directives/`）沿用；没分的（`types/`、`utils/`）新建 `art/`。

- `src/types/art/`、`src/utils/art/` 是 ADP 原件；自有类型与工具平铺成 `src/types/session.ts`、`src/utils/http.ts` 这样
- `src/components/core/`、`src/hooks/core/`、`src/directives/{core,business}/` 已是 ADP 原件，不必另建 `art/`

理由只有一个，但足够：**ADP 升级时 `art/` 与 `core/` 可以整目录对照乃至替换**，不必逐行分辨哪行是上游的、哪行是自己改的。上面第 (1) 段同步的成本直接取决于这件事。

两条配套规则：

- **上游原件连文件名都不改。** `tableCache.ts`、`ComponentLoader.ts` 这类 camelCase / PascalCase 一律原样保留——重命名会让与 ADP 的逐文件对照全部失效。只有自有文件才用 kebab-case。
- **改动大到「接管」的模块不留原件。** `stores/`、`router/`、`apis/` 属于重写而非微调，原件直接删掉；需要参考时去 ADP 仓库或 git 历史里看。在 `art/` 下留一份用不到的副本，只会制造「到底该改哪个」的困惑。

**已知的破例有一处**：`types/art/router/index.ts` 的 `RouteMeta` 加了 `permission` 字段。这个类型被 `art/` 下的菜单组件大量引用，把它整个接管出来会逼着一堆 art 文件改 import，污染比就地加一个字段更大。往 `art/` 里加东西之前先掂量这笔账，别让破例变成常例。

顺带一提，`RouteMeta` 继承了 `Record<string | number | symbol, unknown>`，**这意味着路由 meta 里写错字段名永远不会报错**——ADP 的 `roles`、`authList` 能在改造后一直残留到被专门清理，就是这么来的。

与 ADP 的目录差异，命名向下游看齐以便对照：

| ADP | atelier |
| --- | --- |
| `src/api/` | `src/apis/` |
| `src/store/` + `store/modules/` | `src/stores/`（平铺，无 `modules`） |
| `src/assets/styles/` | `src/styles/` |
| `src/types/{api,common,component,...}` | `src/types/art/{...}` |
| `src/utils/{http,storage,ui,...}` | `src/utils/art/{...}` |
| `router/routes/asyncRoutes.ts` | `router/routes/dynamic-routes.ts`（导出名一并改为 `dynamicRoutes`） |
| `router/guards/beforeEach.ts`、`afterEach.ts` | `router/guards/before-each.ts`、`after-each.ts` |
| `router/routesAlias.ts` | `router/routes-alias.ts` |

`router/core/` 下那几个 PascalCase 文件是 ADP 原件，已在 `core/` 里，按上面的规则不动。

## 与上游的分歧

这份清单比版本号更有价值——它是设计理念与 ADP 分歧的显性化。**同步 ADP 新版时逐条对照，不要把下面这些东西带回来。**

### 已移除的工具链

前三项的原因是同一个——**作者不用这类工具**。不必为它们补技术理由，同步时也不必重新评估。

- **husky、lint-staged**：git hook 那一套
- **commitizen、cz-git、commitlint**：交互式提交与提交信息校验
- **ESLint、Stylelint**，连同桥接包 `eslint-config-prettier`、`eslint-plugin-prettier`。清理还波及 `vite.config.ts` 中 AutoImport 的 `eslintrc` 块（它专为 ESLint 生成 `.auto-import.json`，已无消费者）
- **`vite-plugin-vue-devtools`**：插件版会默认注入页面，大型项目从启动起就处于降速状态。需要时用浏览器扩展版，它按需加载
- **`scripts/clean-dev.ts`**：这一条另有具体理由——它写死的路径已与当前目录结构脱节，且会写回 ADP 的推广链接与演示后端的接口约定。演示内容删哪些、留哪些改为按需手动决定；脚本里那份 21 项的演示内容清单仍有参考价值，可从 git 历史中取回

**Prettier 是保留的**，它是 formatter 不是 linter，清理 lint 工具时别顺手带走。

### 已删除的演示内容

ADP 的演示页面与仅服务于它们的重型组件已整体移除（`src` 从 367 个文件降到 266 个）。判断标准是：**演示页面用完即弃，去 ADP 仓库看就行；可复用组件要留下**。

- 删除的页面：`views/` 下的 article、change、examples、safeguard、template、widgets、dashboard/{analysis,ecommerce}、system/nested
- 删除的组件：wangEditor、excel 导入导出、video、图片裁剪、地图、评论组件——它们各自绑着一个重型 npm 依赖
- **统计卡片（8 个）与图表组件（6 个）全部保留**，哪怕当时只有演示页在引用。下游做后台第一件事就是拼 dashboard，删了每个项目都得重写

连带清理涉及路由模块、`router/modules/index.ts`、i18n 的 menus 键、`fastEnter` 配置、`changeLog` 数据、`optimizeDeps.include`、`env.d.ts` 的 declare module 和 `utils/art/index.ts` 的 re-export——删页面时这几处都要跟着过一遍。

### 已移除的机制

这几样不是演示内容，是 ADP 的实现方式与本项目的设计对不上，对接后端时一并换掉了。

- **ADP 的 HTTP 层**（`utils/art/http/`）：它按 `{ code, msg, data }` 收响应、往 header 注入 token、自带重试与 401 自动登出。响应结构与 `ResponseWrapper` 对不上，token 与 Cookie 会话也不是一回事。换成 `utils/http.ts`：只解包 `result`，不带 token、不重试、不自动登出——重试和登出该由调用方按场景决定，放在这层只会误伤。
- **`v-auth` 与 `v-roles` 指令**：理由见「前端的会话与权限」。`src/directives/` 现在只剩 `highlight` 和 `ripple` 两个纯 UI 指令。
- **userStore 这个杂物袋**：ADP 把登录态、用户信息、语言、搜索历史、锁屏全塞在一个 store 里。语言、搜索历史、锁屏是跟着浏览器走的用户偏好，与登录与否无关，已迁入 `settingStore`；剩下的会话部分由 `stores/session.ts` 接管。
- **`router/core/` 的编排层**（`RouteRegistry`、`MenuProcessor` 的角色过滤、`RoutePermissionValidator`）：守卫重写后，权限在注册这一步就落地了，注册后再校验一遍路径权限是多余的。`ComponentLoader`、`RouteTransformer`、`RouteValidator`、`IframeRouteManager` 属于机制层，保留在 `core/` 下不动。

### 已替换为自有配置

- **Prettier**：`.prettierrc.json`（带 `$schema`），只写与默认不同的项，与 helix-ui 一致
- **tsconfig**：拆成 project references（`tsconfig.app.json` / `tsconfig.node.json`），基础配置取自 `@vue/tsconfig` 与 `@tsconfig/node24`
- **`.gitignore`**：以 Vite 官方模板为底
- **`.vscode/`**：与 helix-ui 保持一致
- **路径别名只保留 `@`**：ADP 的 `@views`/`@imgs`/`@icons`/`@utils`/`@stores`/`@styles` 全部改写为 `@/` 开头的完整路径。当时 `@stores` 指向的是 `src/store`（别名与目录单复数不一致），`@icons` 指向的目录根本不存在——目录现已改名 `src/stores`，别名则没有恢复的打算
- **打包配置做减法**：移除等同默认值的 `target`/`outDir`，`minify` 回落到 esbuild（terser 依赖一并删除），gzip 预压缩交给部署层。体积分析改为 `pnpm build:analyze` 按需启用，而非 ADP 那样整段注释掉
- **自动生成的 `auto-imports.d.ts` / `components.d.ts` 移到项目根目录**：它们是构建产物，不该混在源码里
- **类型声明优先用 `@types/*` 包**：`env.d.ts` 里只留 `vite/client` 引用和全局变量声明，不手写 `declare module`

### 其它

- ADP 的 `README` 与 `CHANGELOG`（含 zh-CN 版本）已删除
- **`atelier-ui/LICENSE` 必须保留**：ADP 采用 MIT，衍生作品须保留原版权声明。清理「上游痕迹」时最容易误删这一个
- **`@plugins` 路径别名未保留**：它只存在于 tsconfig，`vite.config.ts` 里从来没有过，用了会 TS 不报错但构建失败
- `index.html` 补了 `<html lang="zh-CN">`，favicon 改走 `public/`

### 尚未清理的上游痕迹

`src/utils/art/constants/links.ts` 里 7 个常量全指向 ADP（GitHub 仓库、artd.pro 文档站与社区、作者的 B 站），被 `dashboard/console/modules/about-project.vue` 和 `art-header-bar/widget/ArtUserMenu.vue` 引用着。`index.html` 的 `<title>` 和 description 同样还是上游的。**这些是有意留着的**，等决定好要显示什么内容再一起换。

## 仓库构成

两个子项目，各自独立，没有根级别的构建配置。技术栈与作者的个人项目 helix（`github.com/dcsuibian/helix`）保持一致，其 `CLAUDE.md` 里的后端分层与接口约定可作参考。

- `atelier-ui/`：Vue 3 + TypeScript + Vite + Element Plus，ADP 起步，pnpm 管理，Node.js v24.11.1（fnm）
- `atelier-engine/`：Java 25 + Spring Boot 4 + jOOQ + Flyway + PostgreSQL，Testcontainers 测试，`mvnd` 构建，包名 `com.dcsuibian.atelier`

**为什么模板要带后端**：设计理念主要体现在前后端交界面上——分页怎么传、错误怎么返、鉴权怎么挂、列表查询参数怎么组织。Mock Server 只能模拟已经想清楚的接口，没法逼出「这个设计在真实实现里是否别扭」。做真后端等于给设计理念一个证伪机会。

下游项目多为独立仓库、前端目录即仓库根。所以子项目自带一份完整的 `.gitignore`、`.gitattributes` 会更便于取用——**这不是强制要求，只是能兼顾时兼顾一下**。

`.gitignore` 在仓库根忽略 `node_modules/`、`dist/`、`target/` 作为防御。**包管理和构建命令一律在对应子项目目录内执行**，不要在仓库根运行 `pnpm` / `mvnd`。

## 命令

### atelier-ui（在该目录下执行）

- `pnpm dev`：启动开发服务器
- `pnpm build`：并行跑 type-check 与 vite build
- `pnpm build:analyze`：构建并输出体积分析到 `dist/stats.html`
- `pnpm type-check`：`vue-tsc --build`
- `pnpm serve`：预览构建产物
- `pnpm format`：Prettier 格式化，**范围仅 `src/`**，根目录的配置文件不在其中

开发环境前端跑在 **32732**，后端 `development` 跑在 **32733**。前端请求带 `/api` 前缀，由 vite 代理 rewrite 掉——后端没有 context-path，接口路径就是 `/session`、`/users`，前缀属于部署层的事。端口取值区间是 **10000–49151**：Windows 的动态端口从 49152 起，WSL2 与 Hyper-V 的保留块都从那里面划，避开就不会撞上。

**新克隆的仓库首次跑 `pnpm build` 会失败。** `auto-imports.d.ts` / `components.d.ts` 生成在项目根目录且不进版本库，而 `tsconfig.app.json` include 了它们；`build` 又是并行跑 type-check 与构建，type-check 会先撞上缺失的自动导入类型。先跑一次 `pnpm dev` 或 `pnpm build-only` 生成它们即可。

### atelier-engine

（在该目录下执行）

- `mvnd test`：运行测试，Testcontainers 自动起 PostgreSQL 与 Redis，需要 Docker
- `mvnd test-compile exec:java`：重新生成 jOOQ 代码。起临时 PostgreSQL 容器跑完 Flyway 迁移后读取表结构，输出到 `jooq/generated/`。**改完迁移脚本后执行，生成结果提交进版本库**，普通构建因此不依赖 Docker

`BIGSERIAL` 不是标准 IDENTITY 列，jOOQ 不会自动识别。`JooqCodegen` 把所有表的 `id` 列声明为合成自增列；若某张表的 `id` 由应用层赋值，需要在那里排除。

测试与代码生成共用 `TestcontainersConfiguration.POSTGRES_IMAGE`，用 `postgres:16`。固定大版本，免得 `latest` 悄悄升级导致测试环境与生产不一致。刻意不带扩展，因为示例用不到：下游需要 PostGIS 时换成 `postgis/postgis:16-3.5`，要 TimescaleDB（或两者都要）时换成 `timescale/timescaledb-ha:pg16-oss`。换镜像时要加 `.asCompatibleSubstituteFor("postgres")`。

## 代码约定

### atelier-ui

- **类型导入一律 type-only**（`verbatimModuleSyntax` 已开启）。整条 import 的具名导入都是类型时，整条写成 `import type { X } from '...'`；与值混在一条时用内联形式 `import { type X, y } from '...'`，保持单行不拆分。
- **路径引用只用 `@`**，不要新增其它别名。跨目录引用一律 `@/` 开头，不写 `../../` 这种相对路径（同目录内的 `./xxx` 不在此列）。
- **新文件用 kebab-case**，`art/` 与 `core/` 下的上游原件保持原名，理由见「代码组织」一节。
- **递归类型用对象，别用元组。** 自引用的元组（`type X = string | [X, 'AND' | 'OR', X]`）一旦进了 `RouteMeta`，Vue 模板推导路由对象时会撞上 `TS2589: Type instantiation is excessively deep`；对象的自引用是惰性解析的，不会触发。同一份代码在 TS 5.9 + vue-tsc 3.2 下不报错，所以这是工具链版本差异而非写法错误——但对象写法在新旧两边都成立，没有理由赌旧版本。
- **别用 `<!-- @vue-ignore -->` 压 TS2589。** 它能让 type-check 过，代价是那个元素上所有表达式一起失去检查，而且随着使用面扩大要到处补；治本的办法是让类型推导得动。

### atelier-engine

- **枚举值存 Java 枚举名**（`ENABLED`、`MALE`），库里和 JSON 里都一样。Jackson 与 MapStruct 默认就按枚举名转换，不需要 `@JsonValue` 和成对的转换方法。库里用 `VARCHAR` 加 CHECK 约束限定取值，不用 PostgreSQL 原生 ENUM，因为原生 ENUM 很难删改取值。
- **不区分大小写的唯一性不用 CITEXT**，用 `LOWER(col)` 唯一索引兜底，接口层先查重并给出具体文案。
- **密码哈希用 `TEXT`**，不用 `CHAR(60)`：长度由算法保证，不写死，以后才换得了算法。
- **响应统一用 `ResponseWrapper { code, message, result, timestamp }`**：已处理的情况一律返回 HTTP 200，结果看业务码 `code`（借用 HTTP 状态码的语义）；只有没匹配上接口（404 / 405）时返回真实 HTTP 状态码。分页用 `PageWrapper { data, total, pageNumber, pageSize }`，页码从 1 开始，不带 `totalPages`。
- **时间在 JSON 里一律是毫秒时间戳**（`JacksonConfig`）。
- **业务码**：参数错误 400，不存在 404，唯一性冲突 409。
- **密码明文经 HTTPS 传输**，后端直接 BCrypt，前端不做哈希。领域模型的 `password` 标注 `WRITE_ONLY`，任何响应里都不会出现。BCrypt 上限 72 字节，按字节数校验（字符数没超、字节数超的情况会有），超了返回 400。
- **PATCH 里 `null` 表示不修改**，所以部分更新无法把可空字段清空。确实需要清空时再另想办法，不要为此改变 `null` 的语义。
- **基础数据不进 Flyway**，Flyway 只管表结构，基础数据由 `DataInitializer` 在启动时准备：
  - **权限点**写在 `permissions.yml`，每次启动同步进库：新的插入，改过的更新，文件里删掉的置为禁用、不真删。权限码发布后不改名，不再需要时把 `enabled` 改成 `false`。
  - **超级管理员**固定为 id 1，只在用户表为空时创建。初始密码取配置 `atelier.super-admin.initial-password`，生产环境对应环境变量 `ATELIER_PASSWORD`，之后再改这个配置不影响已有密码。
- **超级管理员只在两处特判**：可用权限为全部启用的权限，不走角色；不能被删除或禁用。计算「某人有哪些权限」的逻辑只在 `RbacServiceImpl` 一处。
- **可用权限码缓存在 Redis**，5 分钟过期。改了用户的角色或状态，就清这个用户的缓存；改了角色的权限或状态、同步了权限，就清全部缓存。清缓存要等事务提交后再做（`TransactionUtil.runAfterCommit`）。
- **会话**：Spring Session 存在 Redis，会话 id 走 Cookie。会话里只存 `userId` 和 `loginTime`，`GET /session` 每次都现查用户、拼成 `SessionVo`，所以用户被删除或禁用后，会话自然失效。登录时更换会话 id。
- **删除时连带的数据**：删用户时，连同他的角色分配一起删；删角色时，连同它的权限分配一起删；但角色还分配给用户时拒绝删除（409），以免用户的权限悄悄变少。
- **集成测试继承 `IntegrationTests`**，所有测试共用一个 Spring 上下文和一套容器。新测试不要另加 `@MockitoBean` 之类会改变上下文的注解，否则会多起一套容器。

## 前端的会话与权限

后端不做授权拦截，前端这套东西的目标不是拦截，而是**别让人看见点不动的入口**。真正的鉴权由下游按自己的场景补在后端。

### 会话

- **`stores/session.ts` 是登录态的唯一出口**：`user`、`isLoggedIn`、`ensureLoaded()`、`login()`、`logout()`。登录态在 Cookie 里、前端不持有凭证，服务端才是真相源，本地状态只是副本——所以这个 store 不做持久化，每次启动由守卫 `await ensureLoaded()` 重新向服务端确认。
- **权限由 session 统一编排**，别在其它地方单独去填或清 permission store。两个 store 各自为政的下场是「登出时要记得清七个地方」，漏一个就是 bug。
- **并发去重用进行中的 Promise，不要用 boolean 标志。** `if (!fetched) { await ...; fetched = true }` 这种写法，两个导航同时进来时会重复打后端。
- **先把数据取齐再赋值。** 会话拿到了但权限请求失败时，本地状态应当保持原样，不要留下「有 user 却没有权限」的半截状态。

### 权限

- **权限码是唯一依据，不认角色。** 角色是库里的数据、名字随时会被改；权限码写在后端 `permissions.yml` 里、发布后不改名，只有它适合写进前端代码。ADP 的 `meta.roles`、`v-roles`、`info.buttons` 已全部移除。
- **权限码集中在 `constants/permission.ts`**，一律引用 `PERMISSIONS.XXX`，不写裸字符串——后端增删权限时，靠这张表就能找全前端的引用点。
- **`PermissionExpression` 只有 and / or。** 不要加 NOT：一旦出现「没有某权限才能看见」，权限就不再是单调递增的，加权限反而可能让人少看见东西，排查起来极难。
- **权限在路由注册这一步落地。** `filterByPermission(dynamicRoutes)` 筛完才注册，没权限的路由压根不进路由表，于是菜单、可访问路径、路由表三者天然同源，不必再单独做一遍路径权限校验。子项被筛光的目录会一并消失，所以目录本身不用重复声明权限。
- **按钮级判断只有 `useAuth().hasAuth()` 一条路径**，写成 `v-if="hasAuth(...)"`。`v-auth` 指令已删：它在 `mounted` 之后用 `removeChild` 摘 DOM，绕过虚拟 DOM、不响应权限变化，而且下游真实项目里两年没人用过一次。
- **一个页面都没有时要兜底。** 路由注册结果为空，说明这个账号什么都看不到，应当提示并登出，而不是让他掉进 404。

## 当前状态

- `atelier-ui/`：工具链清理、配置替换、演示内容移除、`import type` 改造、全量格式化、目录重组均已完成，`type-check` 与 `build` 全绿。**登录与会话已对接后端并实测跑通**——真实登录、Cookie 会话、权限拉取、按权限过滤菜单与路由都验证过了。
- **前端尚未对接的部分**：`views/system/{user,role}` 两个页面仍是 ADP 的演示实现，用着 mock 的数据结构与状态值（`status=1`），调用后端会因枚举转换失败返回 400；`apis/system-manage.ts` 是过渡产物，待拆成按资源划分的 `apis/role.ts` 等；`types/art/api/api.d.ts` 里的 `Api.Auth`、`Api.SystemManage` 已作废待删；`views/system/menu` 是 ADP 的菜单管理演示页，依赖不存在的 `/menus` 接口，而前端模式下菜单写在 `router/modules/` 里，这页建议删；注册页与忘记密码页后端没有对应接口，链接目前指向死路。
- `atelier-engine/`：依赖与 jOOQ 代码生成已就绪，数据源按 profile 配置（`development` / `production`）；用户、角色、权限的表结构已建（`V1.1.0`）；用户、角色、权限、会话的接口均已完成。
- **已知的后端小问题**：参数类型转换失败时，`GlobalExceptionHandler` 把 Spring 的原始异常消息透给了前端，内容里带有 `com.dcsuibian.atelier.domain.User$Status` 这样的包名与内部类名——对使用者无意义，也是不必要的实现细节外泄。
- **示例业务域：用户、角色、权限（RBAC）**，另设超级管理员特判。后端只做认证（登录、会话），**不做授权拦截**：权限只用来控制前端的展示和可操作性。后端鉴权取决于使用场景，由下游自行补上。

### 待定

- **是否建 `upstream` 分支存放 ADP 原始代码**（借三方合并让 Git 自动处理非冲突部分）取决于魔改深度：魔改越彻底，冲突率越高，越不如人工读 diff 理解意图后自己写。「代码组织」那套隔离做完后，这件事的必要性进一步下降了——`art/` 与 `core/` 本身已经是可直接对照的锚点。
