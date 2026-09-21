import type { User } from './user'

/**
 * 会话。登录态在 Cookie 里，前端不持有凭证，所以这里没有 token
 *
 * 未登录时 user 与 loginTime 均为 null——`GET /session` 未登录也返回 200，
 * 判断是否登录看 user 是否为 null，不看 HTTP 状态码
 */
interface Session {
  user: User | null
  loginTime: number | null
}

export type { Session }
