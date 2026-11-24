/**
 * 全局错误兜底：没人处理的错误在这里统一记录，需要接监控平台时也从这里上报
 *
 * 已统一处理过的请求错误（弹过提示、交给了 401 的处理、主动取消）不再重复记录，
 * 列表页之类的地方因此不必为了压掉这条日志到处补 catch
 */
import type { App } from 'vue'
import { isHandled } from '@/utils/setup/http'

const IGNORABLE_SCRIPT_ERRORS = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded',
]

function normalizeErrorMessage(message: Event | string): string {
  if ('string' === typeof message) {
    return message
  }
  if ('message' in message && 'string' === typeof message.message) {
    return message.message
  }
  return ''
}

function isIgnorableScriptError(message: Event | string, source?: string): boolean {
  const normalizedMessage = normalizeErrorMessage(message)
  if (!normalizedMessage) {
    return false
  }
  // 浏览器、扩展在布局抖动时常见的 ResizeObserver 噪声，不是真实异常
  if (IGNORABLE_SCRIPT_ERRORS.some(item => normalizedMessage.includes(item))) {
    return true
  }
  // 浏览器扩展注入脚本偶发的跨域 Script error 也没有排查价值
  return 'Script error.' === normalizedMessage && '' === source
}

function handleVueError(err: unknown, instance: unknown, info: string): void {
  console.error('[VueError]', err, info, instance)
}

function handleScriptError(
  message: Event | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error,
): boolean {
  if (isIgnorableScriptError(message, source)) {
    return true
  }
  console.error('[ScriptError]', { message, source, lineno, colno, error })
  // 返回 true 阻止浏览器再打印一次
  return true
}

function handlePromiseError(event: PromiseRejectionEvent): void {
  if (isHandled(event.reason)) {
    event.preventDefault()
    return
  }
  console.error('[PromiseError]', event.reason)
}

/**
 * 资源加载失败（img、script、link）
 */
function handleResourceError(event: Event): void {
  const target = event.target as HTMLElement
  if (target && ('IMG' === target.tagName || 'SCRIPT' === target.tagName || 'LINK' === target.tagName)) {
    console.error('[ResourceError]', {
      tagName: target.tagName,
      src: (target as HTMLImageElement).src || (target as HTMLScriptElement).src || (target as HTMLLinkElement).href,
    })
  }
}

export function setupErrorHandle(app: App): void {
  app.config.errorHandler = handleVueError
  window.onerror = handleScriptError
  window.addEventListener('unhandledrejection', handlePromiseError)
  // 资源加载失败不冒泡，只在捕获阶段才监听得到
  window.addEventListener('error', handleResourceError, true)
}
