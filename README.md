# Atelier

后台管理系统的模板项目，作为我个人开发后台系统时的参考。前端改造自 [Art Design Pro](https://github.com/Daymychen/art-design-pro)，后端是与之配套的 Spring Boot 服务，前后端的接口约定在这里一并落地。

在线演示：<https://atelier.dcsuibian.com>

## 技术栈

- `atelier-ui/`：Vue 3、TypeScript、Vite、Element Plus、ECharts，pnpm 管理
- `atelier-engine/`：Java 25、Spring Boot、jOOQ、Flyway、PostgreSQL、Redis，Maven 构建

## 本地运行

开发环境默认连本机的 PostgreSQL 与 Redis：

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| PostgreSQL | `127.0.0.1:5432` | 库名、用户名都是 `atelier` |
| Redis | `127.0.0.1:6379` | |

密码与超级管理员 `admin` 的初始密码在 `application-development.yml` 里。表结构由 Flyway 在启动时建好。

```sh
cd atelier-engine
mvnd spring-boot:run -Dspring-boot.run.profiles=development
```

```sh
cd atelier-ui
pnpm install
pnpm dev
```

前端开发服务器在 `32732`，后端在 `32733`。

## 文档

`docs/` 里记录设计决策：为什么这样做、哪些判断过不做、什么情况下会重新考虑。`docs/drafts/` 是待审阅的草稿。

- [前端构建与依赖](docs/001、前端构建与依赖.md)
- [前端测试](docs/002、前端测试.md)
- [接口约定](docs/003、接口约定.md)
- [会话与权限](docs/004、会话与权限.md)
- [后端约定](docs/005、后端约定.md)
- [前端写法](docs/006、前端写法.md)

## 许可

MIT。前端保留 Art Design Pro 的原版权声明，见 `atelier-ui/LICENSE`。
