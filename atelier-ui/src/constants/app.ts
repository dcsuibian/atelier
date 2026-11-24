/**
 * 系统级别常量
 *
 * ## 主要功能
 *
 * - 菜单类型（左侧、顶部、混合、双栏）
 * - 主题类型（亮色、暗色、自动）
 * - 菜单主题（设计、亮色、暗色）
 * - 语言类型（中文、英文）
 * - 容器宽度（全屏、固定）
 * - 菜单宽度（收起宽度）
 *
 * @module constants/app
 * @author Art Design Pro Team
 */

/**
 * 菜单类型
 */
export const MenuTypeEnum = {
  /** 左侧菜单 */
  LEFT: 'left',
  /** 顶部菜单 */
  TOP: 'top',
  /** 顶部+左侧菜单 */
  TOP_LEFT: 'top-left',
  /** 双栏菜单 */
  DUAL_MENU: 'dual-menu',
} as const
export type MenuTypeEnum = (typeof MenuTypeEnum)[keyof typeof MenuTypeEnum]

/**
 * 系统主题
 */
export const SystemThemeEnum = {
  /** 暗色主题 */
  DARK: 'dark',
  /** 亮色主题 */
  LIGHT: 'light',
  /** 自动主题（跟随系统） */
  AUTO: 'auto',
} as const
export type SystemThemeEnum = (typeof SystemThemeEnum)[keyof typeof SystemThemeEnum]

/**
 * 菜单主题
 */
export const MenuThemeEnum = {
  /** 暗色主题 */
  DARK: 'dark',
  /** 亮色主题 */
  LIGHT: 'light',
  /** 设计主题 */
  DESIGN: 'design',
} as const
export type MenuThemeEnum = (typeof MenuThemeEnum)[keyof typeof MenuThemeEnum]

/**
 * 菜单宽度
 */
export const MenuWidth = {
  /** 收起宽度 */
  CLOSE: '64px',
} as const
export type MenuWidth = (typeof MenuWidth)[keyof typeof MenuWidth]

/**
 * 语言类型
 */
export const LanguageEnum = {
  /** 中文 */
  ZH_CN: 'zh-CN',
  /** 英文 */
  EN_US: 'en-US',
} as const
export type LanguageEnum = (typeof LanguageEnum)[keyof typeof LanguageEnum]

/**
 * 容器宽度
 */
export const ContainerWidthEnum = {
  /** 全屏宽度 */
  FULL: '100%',
  /** 固定宽度 */
  BOXED: '1200px',
} as const
export type ContainerWidthEnum = (typeof ContainerWidthEnum)[keyof typeof ContainerWidthEnum]
