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

- **`docs/`**：设计决策，写给人看——为什么这样做、哪些判断过不做、坑在哪。动手改某个领域之前，先读 README 索引里对应的那篇。AGENTS.md 不重复其中的理由，只写操作层面的细节。
- **AGENTS.md**：命令、目录、具体文件与类名、只有动手时才用得上的坑。本文件管仓库层面，前后端各自的写在 `atelier-ui/AGENTS.md`、`atelier-engine/AGENTS.md`。
- **代码注释**：贴着某段代码的理由。

新的决策先写成草稿 `docs/drafts/claude-<主题>.md`，作者审过后才移出 `drafts/`、按 `NNN、标题.md` 编号转正，并加进 README 的索引。写法：每条结论配理由，写清坑点和自然会冒出的反问；不举具体代码、不写备选方案与讨论过程、不写会过期的数值与状态；只是当前实现而非规定的，要注明。

## 仓库构成

两个子项目，各自独立，没有根级别的构建配置。技术栈与作者的个人项目 helix（`github.com/dcsuibian/helix`）一致，其 `CLAUDE.md` 里的后端分层与接口约定可作参考。

- `atelier-ui/`：前端，源自 Art Design Pro
- `atelier-engine/`：后端

下游项目多为独立仓库、前端目录即仓库根，所以子项目各自带一份完整的 `.gitignore`、`.gitattributes` 和 `AGENTS.md`，能兼顾时兼顾。仓库根的 `.gitignore` 忽略 `node_modules/`、`dist/`、`target/` 作为防御。**包管理和构建命令一律在对应子项目目录内执行**。

开发端口：前端 **32732**，后端 **32733**。端口取值区间是 **10000–49151**：Windows 的动态端口从 49152 起，WSL2 与 Hyper-V 的保留块都从那里面划。

**推 `main` 即上线。** `.github/workflows/` 按子项目路径分别触发，构建镜像推到 GHCR，再通知服务器更新在线 demo。日常在 `dev` 上开发，上线时把 `main` 快进到 `dev` 再推送。

**版本以 git tag 为准**（如 `v0.2.0`）。`package.json` 的 `0.0.0` 和 pom 的 `0.0.1-SNAPSHOT` 是脚手架默认值，不发布到任何仓库，也就不维护。
