import type { App } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { staticRoutes } from './routes/static-routes'
import { configureNProgress } from '@/utils/art/router'
import { setupBeforeEachGuard } from './guards/before-each'
import { setupAfterEachGuard } from './guards/after-each'
import { setupSessionSync } from './session-sync'

// 创建路由实例
export const router = createRouter({
  // base 取 vite 的 base，部署到子目录时两边才不会错位
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: staticRoutes, // 静态路由
})

// 初始化路由
export function initRouter(app: App<Element>): void {
  configureNProgress() // 顶部进度条
  setupBeforeEachGuard(router) // 路由前置守卫
  setupAfterEachGuard(router) // 路由后置守卫
  setupSessionSync(router) // 登出、权限变化时同步路由
  app.use(router)
}
