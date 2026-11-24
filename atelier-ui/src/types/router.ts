import type { RouteRecordRaw, RouteRecordSingleView } from 'vue-router'
import type { PermissionExpression } from './permission'

/**
 * 路由元数据。菜单、标签页、面包屑都从这里读配置
 */
interface RouteMeta extends Record<string | number | symbol, unknown> {
  /** 标题，可以是 i18n 的键 */
  title: string
  /** 图标 */
  icon?: string
  /** 是否显示徽章 */
  showBadge?: boolean
  /** 文本徽章 */
  showTextBadge?: string
  /** 是否在菜单中隐藏 */
  isHide?: boolean
  /** 是否在标签页中隐藏 */
  isHideTab?: boolean
  /** 外部链接，点击菜单时在新窗口打开 */
  link?: string
  /** 是否缓存 */
  keepAlive?: boolean
  /** 是否为没有子路由的一级菜单。注册路由时自动标出，不用手写 */
  isFirstLevel?: boolean
  /**
   * 访问这个路由需要的权限。不写表示不设限
   *
   * 没有权限的路由压根不会被注册，所以菜单与可访问的路由天然同源，不需要另做校验
   */
  permission?: PermissionExpression
  /** 是否固定标签页 */
  fixedTab?: boolean
  /** 激活菜单路径，用于不在菜单里的详情页高亮它所属的菜单 */
  activePath?: string
  /** 是否为全屏页面，不套侧栏和顶栏 */
  isFullPage?: boolean
}

/**
 * 路由配置。组件只认真实的 import，路径写错在构建期就会报错
 */
interface AppRouteRecord extends Omit<RouteRecordRaw, 'meta' | 'children' | 'component'> {
  meta: RouteMeta
  children?: AppRouteRecord[]
  component?: RouteRecordSingleView['component']
}

export type { RouteMeta, AppRouteRecord }
