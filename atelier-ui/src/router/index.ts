import type { App } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { staticRoutes } from './routes/static-routes'
import { configureNProgress } from '@/utils/art/router'
import { setupBeforeEachGuard } from './guards/before-each'
import { setupAfterEachGuard } from './guards/after-each'

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
  app.use(router)
}

// 主页路径，默认使用菜单第一个有效路径，配置后使用此路径
export const HOME_PAGE_PATH = ''
