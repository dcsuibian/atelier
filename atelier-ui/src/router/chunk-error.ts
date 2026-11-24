/**
 * 发版后的旧页面：index.html 还是旧的，切到没加载过的页面时要下载的 chunk 已经被新版本删掉了。
 * 这时当前页本来也走不下去（后端多半也一起发了版），直接刷新到目标页面，用户就到了新版本
 */

import { SESSION_STORAGE_KEYS } from '@/constants/storage-keys'

/** 各浏览器的报错文案不同，Vite 预加载 CSS 失败另有一句 */
const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_ERROR_PATTERN.test(error.message)
}

/** 这段时间内已经自动刷新过一次，说明刷新也救不回来（比如部署本身坏了），不再刷，免得无限循环 */
const RELOAD_COOLDOWN = 10_000

/**
 * 整页跳转到目标地址，拿新版本的 index.html。短时间内只做一次，做了返回 true
 */
export function reloadTo(fullPath: string): boolean {
  // 存坏了得到 NaN，比较结果为 false，照常刷新
  const last = Number(sessionStorage.getItem(SESSION_STORAGE_KEYS.CHUNK_RELOAD_TIME) ?? 0)
  if (Date.now() - last < RELOAD_COOLDOWN) {
    return false
  }
  sessionStorage.setItem(SESSION_STORAGE_KEYS.CHUNK_RELOAD_TIME, JSON.stringify(Date.now()))
  window.location.assign(fullPath)
  return true
}
