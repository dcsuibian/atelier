/**
 * 本应用对 http 层的定制：失败时弹什么提示、401 时怎么处理。http 层本身不依赖界面与会话
 */
import axios, { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import type { ResponseWrapper } from '@/types'
import { $t } from '@/locales'
import { BusinessError, onRequestError, onUnauthorized } from '@/utils/http'
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
 * 启动时调用。登出后跳登录页由路由层负责，这里只管把会话状态清掉
 */
export function setupHttp(): void {
  onUnauthorized(() => useSessionStore().expire())
  onRequestError(error => ElMessage.error(messageOf(error)))
}
