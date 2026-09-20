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
- **`scripts/clean-dev.ts`**：这一条另有具体理由——它写死的路径已与当前目录结构脱节，且会写回 ADP 的推广链接与演示后端的接口约定。演示内容删哪些、留哪些改为按需手动决定；脚本里那份 21 项的演示内容清单仍有参考价值，可从 git 历史中取回

**Prettier 是保留的**，它是 formatter 不是 linter，清理 lint 工具时别顺手带走。

### 已替换为自有配置

- **Prettier**：`.prettierrc.json`（带 `$schema`），只写与默认不同的项，与 helix-ui 一致
- **tsconfig**：拆成 project references（`tsconfig.app.json` / `tsconfig.node.json`），基础配置取自 `@vue/tsconfig` 与 `@tsconfig/node24`
- **`.gitignore`**：以 Vite 官方模板为底
- **`.vscode/`**：与 helix-ui 保持一致

### 其它

- ADP 的 `README` 与 `CHANGELOG`（含 zh-CN 版本）已删除
- **`atelier-ui/LICENSE` 必须保留**：ADP 采用 MIT，衍生作品须保留原版权声明。清理「上游痕迹」时最容易误删这一个
- **`@plugins` 路径别名未保留**：它只存在于 tsconfig，`vite.config.ts` 里从来没有过，用了会 TS 不报错但构建失败

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
- `pnpm type-check`：`vue-tsc --build`
- `pnpm serve`：预览构建产物
- `pnpm format`：Prettier 格式化，**范围仅 `src/`**，根目录的配置文件不在其中

### atelier-engine

尚未配置数据源，`mvnd` 相关命令暂不可用。

## 当前状态

- `atelier-ui/`：工具链清理与配置替换已完成，ADP 的演示内容尚未动
- `atelier-engine/`：仅有 Spring Initializr 骨架，pom 还缺 MapStruct（含 `annotationProcessorPaths`）、jooq-codegen 插件、`spring-security-crypto`

### 已知遗留

- **`pnpm type-check` 有 3 处报错**，均为 TS 6 收紧类型后暴露的上游问题（wangeditor 未正确暴露类型声明、socket 中两处 `SharedArrayBuffer` 不兼容）。因 `build` 串了 type-check，`pnpm build` 当前同样失败。
- **248/303 个源文件尚未按新 Prettier 配置格式化。** 真跑全量格式化时注意：`htmlWhitespaceSensitivity` 已从 ADP 的 `strict` 回落到默认的 `css`，inline 元素间距可能变化，需要在浏览器里确认。该操作应独立成一个提交。

### 待定

- **示例业务域未定。** 模板需要一条从建表到列表页的完整样例支撑典型场景（分页查询、增删改、外键关联、鉴权），但不能借用任何真实项目的业务模型。
- **是否建 `upstream` 分支存放 ADP 原始代码**（借三方合并让 Git 自动处理非冲突部分）取决于魔改深度：魔改越彻底，冲突率越高，越不如人工读 diff 理解意图后自己写。
