/**
 * HTTP 封装。从 ResponseWrapper 里取出 result，业务码非 200 一律当作失败抛出
 *
 * 与 ADP 那套（utils/art/http）的区别：不带 token、不重试。
 * 登录态在 Cookie 里，凭证由浏览器管；重试该由调用方按场景决定，放在这层只会误伤
 *
 * 401 是唯一的例外，在这层统一拦截：服务端已经断定没登录，本地登录态必然是错的，
 * 这不是调用方能按场景判断的事，交给几十个调用点各自处理只会漏。拦下后怎么处理由应用入口经 onUnauthorized 接上
 *
 * 这一层不依赖界面：失败时弹什么提示由应用入口经 onRequestError 接上
 */
import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ResponseWrapper } from '@/types'

const { VITE_API_URL } = import.meta.env

/**
 * 业务失败：HTTP 200，但业务码不是 200。message 是后端给的文案，可能为空
 */
export class BusinessError extends Error {
  readonly code: number | undefined

  constructor(message: string, code: number | undefined) {
    super(message)
    this.name = 'BusinessError'
    this.code = code
  }
}

let errorHandler: ((error: unknown) => void) | null = null

/**
 * 注册请求失败时的通知，比如弹提示。主动取消、401、调用方传了 silent 的不通知
 */
export function onRequestError(handler: (error: unknown) => void): void {
  errorHandler = handler
}

/** 已经处理过的错误。WeakSet 不阻止错误对象被回收 */
const handledErrors = new WeakSet<object>()

function markHandled(error: unknown): void {
  if (error instanceof Object) {
    handledErrors.add(error)
  }
}

/**
 * 这个错误是否已由 http 层处理过：通知过、交给了 401 的处理，或者是主动取消。
 * 全局兜底据此不再重复记录。传了 silent 的不算，调用方忘了处理时照样会被记下
 */
export function isHandled(error: unknown): boolean {
  return error instanceof Object && handledErrors.has(error)
}

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

let unauthorizedHandler: (() => Promise<void> | void) | null = null

/**
 * 注册 401 的处理。http 是最底层，不反过来依赖会话，由应用入口在启动时接上
 */
export function onUnauthorized(handler: () => Promise<void> | void): void {
  unauthorizedHandler = handler
}

/** 正在进行的处理。多个请求同时 401 时只处理一次，别用 boolean 标志 */
let handling: Promise<void> | null = null

function handleUnauthorized(): void {
  handling ??= Promise.resolve()
    .then(() => unauthorizedHandler?.())
    .catch(error => console.error('[HTTP] 401 处理失败', error))
    .finally(() => {
      handling = null
    })
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ResponseWrapper<unknown>>) => {
    const { code, message } = response.data
    if (200 === code) {
      return response
    }
    return Promise.reject(new BusinessError(message ?? '', code))
  },
  error => {
    if (isUnauthorized(error)) {
      handleUnauthorized()
    }
    return Promise.reject(error)
  },
)

type RequestConfig = AxiosRequestConfig & {
  /** 失败时不通知 onRequestError 注册的处理，交给调用方自己处理 */
  silent?: boolean
}

async function call<T = unknown>(config: RequestConfig): Promise<T> {
  const { silent, ...axiosConfig } = config
  try {
    const response = await axiosInstance.request<ResponseWrapper<T>>(axiosConfig)
    return response.data.result
  } catch (error) {
    if (axios.isCancel(error) || isUnauthorized(error)) {
      // 主动取消不算失败；401 已交给 onUnauthorized 统一处理，再通知一次只是噪音
      markHandled(error)
    } else if (!silent && errorHandler) {
      errorHandler(error)
      markHandled(error)
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
