/**
 * 本应用对请求错误的处理：弹什么提示、401 时怎么办。http 层只管传输，这些策略在启动时经它的 interceptors 挂上
 */
import axios, { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import type { ResponseWrapper } from '@/types'
import { $t } from '@/locales'
import { BusinessError, interceptors } from '@/utils/http'
import { useSessionStore } from '@/stores/session'

/**
 * 后端的业务错误走 HTTP 200 加业务码，能落到这张表里的多半是代理、网关出错，或者接口地址写错
 */
const STATUS_MESSAGE_KEYS: Record<number, string> = {
  403: 'httpMsg.forbidden',
  404: 'httpMsg.notFound',
  405: 'httpMsg.methodNotAllowed',
  408: 'httpMsg.requestTimeout',
  500: 'httpMsg.internalServerError',
  502: 'httpMsg.badGateway',
  503: 'httpMsg.serviceUnavailable',
  504: 'httpMsg.gatewayTimeout',
}

/**
 * axios 自带的 message 是给开发者看的英文，比如 `Network Error`，不能直接给用户看
 */
export function messageOf(error: unknown): string {
  if (error instanceof BusinessError) {
    // body 不是 ResponseWrapper 时（比如接口地址配错，拿到的是前端的 index.html）message 为空，
    // 不兜底就会弹一个空白提示
    return error.message || $t('httpMsg.invalidResponse')
  }
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : $t('httpMsg.requestFailed')
  }
  const { response } = error
  if (response) {
    // 非 2xx 但带了 ResponseWrapper 的，后端给的文案更具体
    const message = (response.data as Partial<ResponseWrapper<unknown>> | undefined)?.message
    if ('string' === typeof message && message) {
      return message
    }
    return $t(STATUS_MESSAGE_KEYS[response.status] ?? 'httpMsg.requestFailed')
  }
  if (!error.request) {
    return $t('httpMsg.requestConfigError')
  }
  if (AxiosError.ETIMEDOUT === error.code || AxiosError.ECONNABORTED === error.code) {
    return $t('httpMsg.requestTimeout')
  }
  return $t('httpMsg.networkError')
}

/**
 * 请求错误该怎么处理。挂上去的拦截器与全局兜底共用这一处判断，两边才不会对不上
 *
 * - canceled：主动取消，不算失败
 * - unauthorized：服务端已断定没登录，清会话。传了 silent 也照样处理，本地登录态必然是错的
 * - silent：调用方说了自己处理
 * - notify：弹提示
 *
 * 不是请求错误时返回 null
 */
function dispositionOf(error: unknown): 'canceled' | 'unauthorized' | 'silent' | 'notify' | null {
  if (axios.isCancel(error)) {
    return 'canceled'
  }
  if (error instanceof BusinessError) {
    return error.response.config.silent ? 'silent' : 'notify'
  }
  if (!axios.isAxiosError(error)) {
    return null
  }
  // 未登录时后端给真实的 HTTP 401，而不是 200 加业务码
  if (401 === error.response?.status) {
    return 'unauthorized'
  }
  return error.config?.silent ? 'silent' : 'notify'
}

/**
 * 这个错误是否已经处理过，全局兜底据此不再重复记录。silent 的不算，调用方忘了处理时照样会被记下
 */
export function isHandled(error: unknown): boolean {
  const disposition = dispositionOf(error)
  return null !== disposition && 'silent' !== disposition
}

/** 进行中的过期处理。多个请求同时 401 时共用它，只提示、登出一次 */
let expiring: Promise<void> | null = null

function expireOnce(): void {
  expiring ??= useSessionStore()
    .expire()
    .catch(error => console.error('[HTTP] 401 处理失败', error))
    .finally(() => {
      expiring = null
    })
}

/**
 * 启动时调用。登出后跳登录页由路由层负责，这里只管把会话状态清掉
 */
export function setupHttp(): void {
  interceptors.response.use(undefined, error => {
    switch (dispositionOf(error)) {
      case 'unauthorized':
        expireOnce()
        break
      case 'notify':
        ElMessage.error(messageOf(error))
        break
    }
    return Promise.reject(error)
  })
}
