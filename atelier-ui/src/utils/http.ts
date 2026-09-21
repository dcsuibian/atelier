/**
 * HTTP 封装。从 ResponseWrapper 里取出 result，业务码非 200 一律当作失败抛出
 *
 * 与 ADP 那套（utils/art/http）的区别：不带 token、不重试、不做 401 自动登出。
 * 登录态在 Cookie 里，凭证由浏览器管；重试和登出该由调用方按场景决定，放在这层只会误伤
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

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ResponseWrapper<unknown>>) => {
    const { code, message } = response.data
    if (200 === code) {
      return response
    }
    return Promise.reject(new Error(message))
  },
  error => Promise.reject(error),
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
    if (!silent) {
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
