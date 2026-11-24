/**
 * 应用往浏览器里存的所有键，集中登记在这里，不在别处随手起名
 *
 * 改键名等于丢掉用户已存的数据。值一律存 JSON
 */

export const LOCAL_STORAGE_KEYS = {
  /** 设置 store 的持久化 */
  SETTING: 'setting',
  /** 表格偏好 store 的持久化 */
  TABLE: 'table',
  /** 工作标签页 store 的持久化 */
  WORK_TAB: 'work-tab',
  /** 明暗主题。index.html 在应用加载前就要读它来避免闪烁，那里写的是字面量，改名要同步 */
  THEME: 'theme',
  /** 窄屏时暂存桌面端的菜单布局，回到宽屏时恢复 */
  DESKTOP_MENU_TYPE: 'desktop-menu-type',
} as const

export const SESSION_STORAGE_KEYS = {
  /** 发版后加载不到旧 chunk 时自动刷新的时间，防止反复刷新 */
  CHUNK_RELOAD_TIME: 'chunk-reload-time',
  /** iframe 路由 */
  IFRAME_ROUTES: 'iframe-routes',
} as const
