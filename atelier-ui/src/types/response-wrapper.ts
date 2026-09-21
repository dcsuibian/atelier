/**
 * 后端统一响应结构。已处理的情况一律返回 HTTP 200，成败看业务码 code（借用 HTTP 状态码的语义），
 * 只有没匹配上接口（404 / 405）时才是真实的 HTTP 状态码
 */
interface ResponseWrapper<T> {
  result: T
  message: string
  code: number
  timestamp: number
}

export type { ResponseWrapper }
