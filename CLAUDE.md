# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 当前状态

仓库处于空白起步阶段：只有 `README.md`（仅标题 `# Atelier`）、`.gitignore` 和 MIT `LICENSE`，尚无源码、构建配置或依赖清单。

**在此仓库有实际代码前，不要臆测构建、测试或运行命令。** 新增子项目或确定技术栈后，请回来补充下面的「命令」和「架构」两节。

## 仓库结构约定

`.gitignore` 表明这是一个容纳多个独立子项目的集合仓库，而非单一工程：

- 根目录同时忽略 `node_modules/`、`dist/`、`target/`，注释写明这是「防御：子项目命令在错误目录（如根目录）误生成的产物」。
- 因此**包管理和构建命令必须在对应子项目目录内执行**，不要在仓库根目录运行 `pnpm` / `mvnd` / `uv` 等命令。
- `.env`、`.env.*` 以及 `.claude/`、`vibe/` 均被忽略，不纳入版本控制。

## 命令

（待补充：首个子项目落地后记录构建、测试、单测运行方式。）

## 架构

（待补充。）
