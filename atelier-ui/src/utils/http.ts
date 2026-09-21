/**
 * HTTP 封装。从 ResponseWrapper 里取出 result，业务码非 200 一律当作失败抛出
 *
 * 与 ADP 那套（utils/art/http）的区别：不带 token、不重试。
 * 登录态在 Cookie 里，凭证由浏览器管；重试该由调用方按场景决定，放在这层只会误伤
 *
 * 401 是唯一的例外，在这层统一处理：服务端已经断定没登录，本地登录态必然是错的，
 * 这不是调用方能按场景判断的事，交给几十个调用点各自处理只会漏
 */
import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ResponseWrapper } from '@/types'

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
      ElMessage.error('登录状态已失效，请重新登录')
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
    return Promise.reject(new Error(message))
  },
  error => {
    if (isUnauthorized(error)) {
      handleUnauthorized()
    }
    return Promise.reject(error)
  },
)

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
    // 401 的提示与跳转已由 handleUnauthorized 统一做过，这里再弹一次只是噪音
    if (!silent && !isUnauthorized(error)) {
      if (error instanceof Error) {
        ElMessage.error(error.message)
      } else {
        console.error(error)
      }
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
