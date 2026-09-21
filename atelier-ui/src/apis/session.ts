import type { Session } from '@/types'
import request from '@/utils/http'

/**
 * 未登录也返回 200，此时 session.user 为 null
 */
export function getSession(): Promise<Session> {
  return request.get({
    url: '/session',
  })
}

export function login(data: { name: string; password: string }): Promise<Session> {
  return request.post({
    url: '/session',
    data,
  })
}

export function logout(): Promise<void> {
  return request.delete({
    url: '/session',
  })
}
