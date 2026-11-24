/**
 * 菜单状态管理模块
 *
 * 提供菜单数据和动态路由的状态管理
 *
 * ## 主要功能
 *
 * - 菜单列表存储和管理
 * - 首页路径配置
 * - 动态路由注册和移除
 * - 路由移除函数管理
 * - 菜单宽度配置
 *
 * ## 使用场景
 *
 * - 动态菜单加载和渲染
 * - 路由权限控制
 * - 首页路径动态设置
 * - 登出时清理动态路由
 *
 * ## 工作流程
 *
 * 1. 获取菜单数据（前端/后端模式）
 * 2. 设置菜单列表和首页路径
 * 3. 注册动态路由并保存移除函数
 * 4. 登出时调用移除函数清理路由
 *
 * @module stores/menu
 * @author Art Design Pro Team
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppRouteRecord } from '@/types'
import { getFirstMenuPath } from '@/utils/art'

/**
 * 菜单状态管理
 * 管理应用的菜单列表、首页路径与菜单宽度。动态路由的注销归 DynamicRouteRegistry
 */
// 主页路径，默认使用菜单第一个有效路径，配置后使用此路径
const HOME_PAGE_PATH = ''

export const useMenuStore = defineStore('menu', () => {
  /** 首页路径 */
  const homePath = ref(HOME_PAGE_PATH)
  /** 菜单列表 */
  const menuList = ref<AppRouteRecord[]>([])
  /** 菜单宽度 */
  const menuWidth = ref('')

  /**
   * 设置菜单列表
   * @param list 菜单路由记录数组
   */
  const setMenuList = (list: AppRouteRecord[]) => {
    menuList.value = list
    setHomePath(HOME_PAGE_PATH || getFirstMenuPath(list))
  }

  /**
   * 获取首页路径
   * @returns 首页路径字符串
   */
  const getHomePath = () => homePath.value

  /**
   * 设置主页路径
   * @param path 主页路径
   */
  const setHomePath = (path: string) => {
    homePath.value = path
  }

  return {
    menuList,
    menuWidth,
    setMenuList,
    getHomePath,
    setHomePath,
  }
})
