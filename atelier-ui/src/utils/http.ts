/**
 * HTTP 封装。从 ResponseWrapper 里取出 result，业务码非 200 一律当作失败抛出
 *
 * 与 ADP 那套（utils/art/http）的区别：不带 token、不重试。
 * 登录态在 Cookie 里，凭证由浏览器管；重试该由调用方按场景决定，放在这层只会误伤
 *
 * 401 是唯一的例外，在这层统一处理：服务端已经断定没登录，本地登录态必然是错的，
 * 这不是调用方能按场景判断的事，交给几十个调用点各自处理只会漏
 */
import { ElMessage } from 'element-plus'
import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ResponseWrapper } from '@/types'
// 只在拦截器里调用，与 locales 之间的循环引用不影响模块初始化
import { $t } from '@/locales'

const { VITE_API_URL } = import.meta.env

const axiosInstance = axios.create({
  baseURL: VITE_API_URL,
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (typeof contentType === 'string' && contentType.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    },
  ],
})

axiosInstance.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  // 有请求体且不是 FormData，按 JSON 发
  if (undefined !== request.data && !(request.data instanceof FormData) && !request.headers.has('Content-Type')) {
    request.headers.set('Content-Type', 'application/json')
    request.data = JSON.stringify(request.data)
  }
  return request
})

/**
 * 未登录。后端对这种情况给真实 HTTP 401，而不是 200 加业务码
 */
function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && 401 === error.response?.status
}

/** 正在进行的登出。多个请求同时 401 时只登出一次，别用 boolean 标志 */
let loggingOut: Promise<void> | null = null

function handleUnauthorized(): void {
  loggingOut ??= (async () => {
    // 动态 import 断开循环依赖：session store 经 apis 绕回到这里
    const { useSessionStore } = await import('@/stores/session')
    const sessionStore = useSessionStore()
    if (sessionStore.isLoggedIn) {
      ElMessage.error($t('httpMsg.sessionExpired'))
    }
    await sessionStore.logout()
  })().finally(() => {
    loggingOut = null
  })
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ResponseWrapper<unknown>>) => {
    const { code, message } = response.data
    if (200 === code) {
      return response
    }
    // body 不是 ResponseWrapper 时（比如接口地址配错，拿到的是前端的 index.html）message 为空，
    // 不兜底就会弹一个空白提示
    return Promise.reject(new Error(message ?? $t('httpMsg.invalidResponse')))
  },
  error => {
    if (isUnauthorized(error)) {
      handleUnauthorized()
    }
    return Promise.reject(error)
  },
)

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
 * 把请求失败转成给用户看的提示。axios 自带的 message 是给开发者看的英文，比如 `Network Error`
 */
export function messageOf(error: unknown): string {
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

type RequestConfig = AxiosRequestConfig & {
  /** 失败时不弹提示，交给调用方自己处理 */
  silent?: boolean
}

async function call<T = unknown>(config: RequestConfig): Promise<T> {
  const { silent, ...axiosConfig } = config
  try {
    const response = await axiosInstance.request<ResponseWrapper<T>>(axiosConfig)
    return response.data.result
  } catch (error) {
    // 主动取消不算失败；401 的提示与跳转已由 handleUnauthorized 统一做过，这里再弹一次只是噪音
    if (!silent && !axios.isCancel(error) && !isUnauthorized(error)) {
      ElMessage.error(messageOf(error))
    }
    return Promise.reject(error)
  }
}

const request = {
  get<T>(config: RequestConfig) {
    return call<T>({ ...config, method: 'GET' })
  },
  post<T>(config: RequestConfig) {
    return call<T>({ ...config, method: 'POST' })
  },
  put<T>(config: RequestConfig) {
    return call<T>({ ...config, method: 'PUT' })
  },
  patch<T>(config: RequestConfig) {
    return call<T>({ ...config, method: 'PATCH' })
  },
  delete<T>(config: RequestConfig) {
    return call<T>({ ...config, method: 'DELETE' })
  },
}

export default request
