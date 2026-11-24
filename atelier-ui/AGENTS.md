# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this directory.

atelier 的前端。仓库层面的约束（公开仓库须脱敏、文档分工）见仓库根的 `AGENTS.md`，设计理由见根目录 `docs/`。

## 上游：Art Design Pro

源自 [Art Design Pro](https://github.com/Daymychen/art-design-pro)（下称 ADP），现已降为参考，定位见 `docs/` 的「项目定位与上游」。

**当前对齐版本：v3.0.2（2026-03-15）。** 这是跟进 ADP 新版时的锚点，**每次同步后必须更新它**。

## 代码组织：ADP 原件与自有代码

- `art/` 下是 ADP 原件或在原件上改的：`components/art/`（按用途分 `layouts`、`forms`、`cards`、`charts`、`icons`、`tables` 等）、`composables/art/`、`styles/art/`、`utils/art/`、`types/art/`（只剩系统配置的类型）
- 自有代码平铺：如 `components/app-layout/`、`components/chart-view/`、`composables/use-chart.ts`、`utils/http.ts`、`types/user.ts`（与后端对接的类型都在 `types/` 根上）
- 整体接管、不再区分原件的目录：`router/`、`stores/`、`apis/`、`directives/`、`config/`、`constants/`、`locales/`

几条命名规则：

- 子目录统一叫 `art/`，不用 `core`、`common` 这类不表达含义的名字。只装一个文件的目录去掉（组件与页面的 `目录/index.vue` 例外）；单复数按「一组同类个体用复数，被拆成模块的整体用单数」。目录不叫 ADP 的 `hooks`：那是 React 的叫法，Vue 官方叫 composables
- `art/` 下的原件保留原名（`useTheme.ts`、`SidebarSubmenu.vue` 这类 camelCase / PascalCase），改名会让逐文件对照失效。自有文件一律 kebab-case。组件名与 `art-` 前缀沿用 ADP

**`art/` 里的小改动标 `atelier：` 注释**，用 `rg -n 'atelier：' src` 能找全。格式化、`import type`、路径别名、`useUserStore()` 按内容改到 `settingStore` / `sessionStore` 这类机械改动不标，标了反而淹没真正的改动。需要多解释的两处：

- 路由类型（`RouteMeta`、`AppRouteRecord`）已接管，挪到 `types/router.ts`，从 `@/types` 导入。ADP 里用于后端菜单模式的字段（`authList`、`authMark`、`isAuthButton`、`parentPath`、`id`）随之删了。
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
| `router/modules/` | `router/routes/modules/`，由 `dynamic-routes.ts` 直接汇总 |
| `router/guards/beforeEach.ts`、`afterEach.ts` | `router/before-each.ts`、`after-each.ts`（`guards/` 已展平） |
| `router/routesAlias.ts` | 删除，登录页按路由名 `Login` 判断 |

ADP 的 `router/core/` 已拆散：`MenuProcessor` 改名 kebab-case 挪到 `router/` 下，`IframeRouteManager` 随 iframe 页面一起删了，其余随按字符串加载组件一起删了。

## 跟进 ADP 时不要带回来的东西

理由见 `docs/` 对应的篇目，这里只是清单。

**工具链**：husky、lint-staged、commitizen、cz-git、commitlint、ESLint、Stylelint（连同 `eslint-config-prettier`、`eslint-plugin-prettier`）、`vite-plugin-vue-devtools`、`scripts/clean-dev.ts`（写死的路径已脱节，且会写回 ADP 的推广链接；它的演示内容清单可从 git 历史取回参考）。**Prettier 是保留的**，它是 formatter 不是 linter。

**演示内容**：判断标准是演示页面用完即弃，可复用组件留下。

- 删除的页面：`views/` 下的 article、change、examples、safeguard、template、widgets、dashboard/{analysis,ecommerce}、system/nested、system/menu
- 删除的组件：wangEditor、excel 导入导出、video、图片裁剪、地图、评论组件，以及聊天窗口、消息通知、节日烟花、升级提示、顶栏快速入口
- **统计卡片与图表组件全部保留**，哪怕只有演示页在引用
- 删页面时要连带过一遍：路由模块、`router/routes/dynamic-routes.ts`、i18n 的 menus 键、`env.d.ts` 的 declare module、`utils/art/index.ts` 的 re-export

**机制**：

- ADP 的 HTTP 层（`utils/art/http/`），换成 `utils/http.ts`
- `v-auth`、`v-roles` 指令，`meta.roles`、`info.buttons`；`src/directives/` 只剩 `ripple`
- userStore 这个杂物袋：语言、搜索历史、锁屏迁入 `settingStore`，会话归 `stores/session.ts`。锁屏存在偏好里，生命周期却跟着会话，由 `utils/setup/lock-screen.ts` 订阅会话，确认没登录时解除，拆分时容易漏掉
- `router/core/` 的编排层（`RouteRegistry`、角色过滤、`RoutePermissionValidator`）
- 后端路由模式与按字符串加载组件（`ComponentLoader`）；`AppRouteRecord.component` 不再接受字符串。布局外壳在 `components/app-layout/`
- `useTable` 及配套（`useTableColumns`、`utils/art/table/`、`Api.Common`、`ArtTableHeader`），表格页以用户管理页为准
- 自动导入插件（`unplugin-auto-import`、`unplugin-vue-components`、`unplugin-element-plus`）
- iframe 内嵌页面（`meta.isIframe`、`/outside` 路由、`views/outside/`、`IframeRouteManager`）。外链菜单（`meta.link`）保留
- 版本化存储键与存储兼容性检查（`utils/art/storage/`），连同 `__APP_VERSION__`；控制台宣传语（`utils/art/sys/console.ts`）
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

**`LICENSE` 必须保留**：清理上游痕迹时最容易误删。

**尚未清理的上游痕迹**：`src/utils/art/constants.ts` 里的常量全指向 ADP（GitHub、文档站、社区、作者的 B 站），被 `dashboard/console/modules/about-project.vue` 和 `art-header-bar/widget/ArtUserMenu.vue` 引用；`index.html` 的 `<title>` 和 description 也还是上游的。**有意留着**，等决定好要显示什么再一起换。

## 命令

技术栈：Vue 3 + TypeScript + Vite + Element Plus，pnpm 管理，Node.js v24.11.1（fnm）。

- `pnpm dev`：启动开发服务器
- `pnpm build`：并行跑 type-check 与 vite build
- `pnpm build:analyze`：构建并输出体积分析到 `dist/stats.html`
- `pnpm type-check`：`vue-tsc --build`
- `pnpm serve`：预览构建产物
- `pnpm format`：Prettier 格式化，**范围仅 `src/` 与 `tests/`**
- `pnpm test`：vitest，配置在独立的 `vitest.config.ts`。测试放 `tests/`，目录结构对照 `src`

开发服务器跑在 **32732**。请求带 `/api` 前缀，由 vite 代理到后端的 32733 并 rewrite 掉——后端没有 context-path，接口路径就是 `/session`、`/users`，前缀属于部署层的事。

**部署**：`Dockerfile` 两阶段构建，产物交给 nginx。镜像里只跑 `build-only`，不跑 type-check。路由用 history 模式，nginx 把所有路径回落到 `index.html`；`/api` 的反代由外层负责。

## 代码约定

决策与理由见 `docs/` 的「前端构建与依赖」「前端写法」「会话与权限」。动手时要注意的：

- **类型导入一律 type-only**（`verbatimModuleSyntax` 已开启）。整条都是类型时写 `import type { X } from '...'`；与值混在一条时用内联 `import { type X, y } from '...'`，保持单行不拆分。
- **一律显式 import**。全局可用的只有 `RouterView` / `RouterLink` 和 `main.ts` 里注册的 `v-ripple`；Element Plus 的 `v-loading` 也要 import `vLoading`。
- **路径**：引用全局的东西用 `@/`，只在一块内部共享的（如某个组件目录下的 composables、几个页面共用的模块）用相对路径。不要新增其它别名。
- **递归类型用对象，别用元组。** 自引用的元组一旦进了 `RouteMeta`，模板推导路由对象时会撞上 `TS2589: Type instantiation is excessively deep`；对象的自引用是惰性解析的，不会触发。
- **别用 `<!-- @vue-ignore -->` 压 TS2589**：那个元素上所有表达式会一起失去检查，治本是让类型推导得动。
- **i18n**：`zh-cn.json` 与 `en-us.json` 的键保持一致，AI 写的要把英文一并补上。脚本里用 `useI18n()` 的 `t`，组件外用 `@/locales` 导出的 `$t`。
- **本地存储**：键一律登记在 `constants/storage-keys.ts`。store 要持久化就声明 `persist: { key: LOCAL_STORAGE_KEYS.XXX }`，读回时由 `stores/persist.ts` 按默认值逐字段检查类型，对不上的丢掉；字段里嵌着对象的（如标签页列表），在 `afterHydrate` 里自己逐项查。语言要在 store 建立前定下来，`locales/index.ts` 直接读设置 store 存的那份。
- **日期时间**：展示时用 `utils/format.ts` 的 `formatDateTime` 等，目前是固定格式、不随语言切换。需要月份名、星期名这类本地化文字时，可以用 `Intl.DateTimeFormat`。
- **列表接口**：写成 `getXxxs(query, pageNumber, pageSize)`，返回 `PageWrapper`。后端另有不分页的全量接口时，再加一个 `getXxxs(query)` 重载返回数组（如 `getPermissions`）。重载只区分分页与全量；一个资源只用一种分页方式，真要另一种（如游标）就起别的名字，别靠参数类型区分。
- **查询条件的可选字段写成 `?: X | null`**：请求都走 axios，`null` 与 `undefined` 在查询参数里都会被丢掉，两者等价。这是 axios 文档写明的行为，不用另写测试。
- **类型放哪**：`types/` 只放没有唯一归属的类型：与后端约定的数据结构、`ResponseWrapper` / `PageWrapper` 这类协议外壳、多处共用的概念（如 `Tensor`）。接口的查询条件与请求体跟着接口放在 `apis/`；组件、store 自己的类型写在自己文件里。
- **接口类型的命名与后端一致**：查询条件叫 `XxxQo`，请求体叫 `XxxDto`，带动作的资源名在前（`ProjectAddDto`、`ProjectEditPartiallyDto`），返回的数据直接用 `types/` 里的 `Project` 等，不加 `Vo`。新增与部分更新分成两个类型：新增的必填字段写成必填，部分更新是它的 `Partial`。
- **会话与权限**：
  - `stores/session.ts` 是登录态的唯一出口（`user`、`isLoggedIn`、`ensureLoaded()`、`login()`、`logout()`），权限由它统一编排，别在别处单独填或清 permission store。
  - 权限码集中在 `constants/permission.ts`，一律引用 `PERMISSIONS.XXX`。按钮级判断写 `v-if="permissionStore.check(...)"`，与路由守卫共用。
  - `PermissionExpression` 只有 and / or。路由由 `filterByPermission(dynamicRoutes)` 筛完才注册。
  - **依赖只朝一个方向**：页面 → 路由 → store → apis → `utils/http.ts`，下层不 import 上层。session store 只管状态，不碰路由；登出后跳登录页、权限变了重新注册路由，由 `router/session-sync.ts` 订阅会话与权限的变化去做（原地重新导航，交给守卫决定去哪）。所以 `await logout()` 返回时还不一定已在登录页。
  - `utils/http.ts` 只管传输：拆 `ResponseWrapper`、业务码非 200 抛 `BusinessError`，响应体不是 `ResponseWrapper` 抛 `AxiosError`（`ERR_BAD_RESPONSE`），导出 `interceptors` 供上层挂处理。出错后怎么办（401 调 `sessionStore.expire()`、其余弹提示、`silent` 不弹）都在 `utils/setup/http.ts` 的 `setupHttp()` 里挂的拦截器中，判断集中在 `dispositionOf`，文案由 `messageOf` 翻译。它必须挂在拆包装的拦截器之后，业务失败才会经过它；http 模块加载时就挂好了拆包装，所以顺序天然成立。`utils/setup/` 放启动时调用、把各层接起来的代码，不是通用工具。
  - 全局错误兜底在 `utils/setup/error-handle.ts`（原 ADP 的 `utils/art/sys/error-handle.ts`，已接管）。没人 catch 的 Promise 失败若已统一处理过（`utils/setup/http.ts` 的 `isHandled`），不再重复记录，列表页不必为此补 catch；传了 `silent` 的不算已处理。`GET /session` 未登录时返回 200，守卫的 `ensureLoaded()` 不受 401 处理影响。
  - 并发去重（会话加载、401 登出）用进行中的 Promise。

## 现状与待办

- 注册页与忘记密码页后端没有对应接口，链接指向死路，**有意留着作参考**，不要顺手删。
- 图标经 `@iconify/vue` 运行时从 Iconify 的在线服务加载，模板不做离线化，由下游按部署环境决定。断网时图标只会变成空白、不报错；要离线就启用 `utils/art/ui/iconify-loader.ts`，把用到的图标集打包注册。
- `useHeaderBar`、`useLayoutHeight`、`useTableHeight` 只有 1～3 处引用，不单独处理，随对应功能的去留走。
- ADP 演示页（工作台、个人中心、注册、忘记密码）里仍有写死的中文与演示数据，随这些页面的去留一起处理。
