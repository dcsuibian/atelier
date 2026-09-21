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

连带清理涉及路由模块、`router/modules/index.ts`、i18n 的 menus 键、`fastEnter` 配置、`changeLog` 数据、`optimizeDeps.include`、`env.d.ts` 的 declare module 和 `utils/index.ts` 的 re-export——删页面时这几处都要跟着过一遍。

### 已替换为自有配置

- **Prettier**：`.prettierrc.json`（带 `$schema`），只写与默认不同的项，与 helix-ui 一致
- **tsconfig**：拆成 project references（`tsconfig.app.json` / `tsconfig.node.json`），基础配置取自 `@vue/tsconfig` 与 `@tsconfig/node24`
- **`.gitignore`**：以 Vite 官方模板为底
- **`.vscode/`**：与 helix-ui 保持一致
- **路径别名只保留 `@`**：ADP 的 `@views`/`@imgs`/`@icons`/`@utils`/`@stores`/`@styles` 全部改写为 `@/` 开头的完整路径。其中 `@stores` 指向的是 `src/store`（单复数不一致），`@icons` 指向的目录根本不存在
- **打包配置做减法**：移除等同默认值的 `target`/`outDir`，`minify` 回落到 esbuild（terser 依赖一并删除），gzip 预压缩交给部署层。体积分析改为 `pnpm build:analyze` 按需启用，而非 ADP 那样整段注释掉
- **自动生成的 `auto-imports.d.ts` / `components.d.ts` 移到项目根目录**：它们是构建产物，不该混在源码里
- **类型声明优先用 `@types/*` 包**：`env.d.ts` 里只留 `vite/client` 引用和全局变量声明，不手写 `declare module`

### 其它

- ADP 的 `README` 与 `CHANGELOG`（含 zh-CN 版本）已删除
- **`atelier-ui/LICENSE` 必须保留**：ADP 采用 MIT，衍生作品须保留原版权声明。清理「上游痕迹」时最容易误删这一个
- **`@plugins` 路径别名未保留**：它只存在于 tsconfig，`vite.config.ts` 里从来没有过，用了会 TS 不报错但构建失败
- `index.html` 补了 `<html lang="zh-CN">`，favicon 改走 `public/`

### 尚未清理的上游痕迹

`src/utils/constants/links.ts` 里 7 个常量全指向 ADP（GitHub 仓库、artd.pro 文档站与社区、作者的 B 站），被 `dashboard/console/modules/about-project.vue` 和 `art-header-bar/widget/ArtUserMenu.vue` 引用着。`index.html` 的 `<title>` 和 description 同样还是上游的。**这些是有意留着的**，等决定好要显示什么内容再一起换。

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

**新克隆的仓库首次跑 `pnpm build` 会失败。** `auto-imports.d.ts` / `components.d.ts` 生成在项目根目录且不进版本库，而 `tsconfig.app.json` include 了它们；`build` 又是并行跑 type-check 与构建，type-check 会先撞上缺失的自动导入类型。先跑一次 `pnpm dev` 或 `pnpm build-only` 生成它们即可。

### atelier-engine

（在该目录下执行）

- `mvnd test`：运行测试，Testcontainers 自动起 PostgreSQL 与 Redis，需要 Docker

## 代码约定

### atelier-ui

- **类型导入一律 type-only**（`verbatimModuleSyntax` 已开启）。整条 import 的具名导入都是类型时，整条写成 `import type { X } from '...'`；与值混在一条时用内联形式 `import { type X, y } from '...'`，保持单行不拆分。
- **路径引用只用 `@`**，不要新增其它别名。

## 当前状态

- `atelier-ui/`：工具链清理、配置替换、演示内容移除、`import type` 改造、全量格式化均已完成。`type-check` 与 `build` 全绿。
- `atelier-engine/`：依赖已补齐，jOOQ 代码生成尚未配置，数据源按 profile 配置（`development` / `production`）；迁移脚本尚空，业务代码未开始。
- **示例业务域：用户、角色、权限（RBAC）**，另设超级管理员特判。后端只做认证（登录、会话），**不做授权拦截**：权限只用来控制前端的展示和可操作性。后端鉴权取决于使用场景，由下游自行补上。

### 待定

- **种子数据放在哪里。** Flyway 主要管结构，权限点、初始超管账号、开发用的演示数据分别该放哪里还没定。
- **是否建 `upstream` 分支存放 ADP 原始代码**（借三方合并让 Git 自动处理非冲突部分）取决于魔改深度：魔改越彻底，冲突率越高，越不如人工读 diff 理解意图后自己写。
