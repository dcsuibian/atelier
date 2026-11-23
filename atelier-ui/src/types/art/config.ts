/**
 * 系统配置（@/config）的类型，以及其中引用的主题、菜单主题、顶部栏功能开关
 *
 * @module types/art/config
 * @author Art Design Pro Team
 */

import { MenuThemeEnum, MenuTypeEnum, SystemThemeEnum } from '@/constants/app'

// 系统主题样式（light | dark）
export interface SystemThemeType {
  /** 主题类名 */
  className: string
}

// 定义包含多个主题的类型
export type SystemThemeTypes = {
  [key in Exclude<SystemThemeEnum, typeof SystemThemeEnum.AUTO>]: SystemThemeType
}

// 菜单主题样式
export interface MenuThemeType {
  /** 主题类型 */
  theme: MenuThemeEnum
  /** 背景颜色 */
  background: string
  /** 系统名称颜色 */
  systemNameColor: string
  /** 文本颜色 */
  textColor: string
  /** 图标颜色 */
  iconColor: string
  /** 背景图片 */
  img?: string
}

// 主题设置
export interface ThemeSetting {
  /** 主题名称 */
  name: string
  /** 系统主题类型 */
  theme: SystemThemeEnum
  /** 主题颜色数组 */
  color: string[]
  /** 左侧线条颜色 */
  leftLineColor: string
  /** 右侧线条颜色 */
  rightLineColor: string
  /** 主题图片 */
  img: string
}

// 菜单布局
export interface MenuLayout {
  /** 布局名称 */
  name: string
  /** 菜单类型值 */
  value: MenuTypeEnum
  /** 布局预览图 */
  img: string
  /** 布局描述 */
  description?: string
}

// 系统基础配置
export interface SystemBasicConfig {
  // 系统名称
  name: string
  // 系统描述
  description?: string
  // 系统logo
  logo?: string
  // 系统favicon
  favicon?: string
  // 版权信息
  copyright?: string
}

// 系统配置
export interface SystemConfig {
  // 系统基础信息
  systemInfo: SystemBasicConfig
  // 系统主题样式
  systemThemeStyles: SystemThemeTypes
  // 设置主题列表
  settingThemeList: ThemeSetting[]
  // 菜单布局列表
  menuLayoutList: MenuLayout[]
  // 主题列表
  themeList: MenuThemeType[]
  // 暗色菜单样式
  darkMenuStyles: MenuThemeType[]
  // 系统主色调
  systemMainColor: readonly string[]
  // 顶部栏功能配置
  headerBar?: HeaderBarFeatureConfig
}

// 功能配置项基础接口
export interface FeatureConfigItem {
  enabled: boolean
  description: string
}

// 顶部栏功能配置接口
export interface HeaderBarFeatureConfig {
  /** 菜单按钮 */
  menuButton: FeatureConfigItem
  /** 刷新按钮 */
  refreshButton: FeatureConfigItem
  /** 面包屑导航 */
  breadcrumb: FeatureConfigItem
  /** 全局搜索 */
  globalSearch: FeatureConfigItem
  /** 全屏功能 */
  fullscreen: FeatureConfigItem
  /** 多语言切换 */
  language: FeatureConfigItem
  /** 设置面板 */
  settings: FeatureConfigItem
  /** 主题切换 */
  themeToggle: FeatureConfigItem
}
