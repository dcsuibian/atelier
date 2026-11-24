/**
 * HTTP 封装：发请求，从 ResponseWrapper 里取出 result，业务码非 200 一律当作失败抛出
 *
 * 这里只管传输。出错之后怎么办（弹提示、401 时清会话）是应用的策略，由启动时经 interceptors 挂上，
 * 所以这一层不依赖界面和会话
 *
 * 不带 token：登录态在 Cookie 里，凭证由浏览器管。
 * 不重试：该不该重试由调用方按场景决定，放在这层只会误伤
 */
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ResponseWrapper } from '@/types'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** 这次请求失败时不走统一的失败提示，交给调用方自己处理 */
    silent?: boolean
  }
}

/**
 * 业务失败：HTTP 200，但业务码不是 200。message 是后端给的文案，可能为空
 */
class BusinessError extends Error {
  readonly code: number | undefined
  /** 与 AxiosError 一样带上响应，出错后的处理能拿到这次请求的配置 */
  readonly response: AxiosResponse

  constructor(message: string, code: number | undefined, response: AxiosResponse) {
    super(message)
    this.name = 'BusinessError'
    this.code = code
    this.response = response
  }
}

const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL })

axiosInstance.interceptors.response.use((response: AxiosResponse<ResponseWrapper<unknown>>) => {
  const { code, message } = response.data
  if (200 === code) {
    return response
  }
  return Promise.reject(new BusinessError(message ?? '', code, response))
})

/** 给应用挂出错后的处理用。后挂的排在拆包装之后，业务失败也会经过它 */
const interceptors = axiosInstance.interceptors

async function call<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.request<ResponseWrapper<T>>(config)
  return response.data.result
}

const request = {
  get<T>(config: AxiosRequestConfig) {
    return call<T>({ ...config, method: 'GET' })
  },
  post<T>(config: AxiosRequestConfig) {
    return call<T>({ ...config, method: 'POST' })
  },
  put<T>(config: AxiosRequestConfig) {
    return call<T>({ ...config, method: 'PUT' })
  },
  patch<T>(config: AxiosRequestConfig) {
    return call<T>({ ...config, method: 'PATCH' })
  },
  delete<T>(config: AxiosRequestConfig) {
    return call<T>({ ...config, method: 'DELETE' })
  },
}

export { BusinessError, interceptors }
export default request
