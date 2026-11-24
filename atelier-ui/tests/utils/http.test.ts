import { AxiosError, type AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'
import request, { BusinessError } from '@/utils/http'

/** 不发真请求，直接给出这样一个 HTTP 200 响应 */
function respondWith(data: unknown): AxiosAdapter {
  return async config => ({ data, status: 200, statusText: 'OK', headers: {}, config })
}

describe('request', () => {
  it('业务码为 200 时只返回 result', async () => {
    const result = await request.get({ url: '/anything', adapter: respondWith({ code: 200, result: { id: 1 } }) })
    expect(result).toEqual({ id: 1 })
  })

  it('业务码不是 200 时抛出 BusinessError，带着这次请求的配置', async () => {
    const error = await request
      .get<never>({ url: '/anything', silent: true, adapter: respondWith({ code: 409, message: '名称已存在' }) })
      .catch((e: BusinessError) => e)
    expect(error).toBeInstanceOf(BusinessError)
    expect(error.message).toBe('名称已存在')
    expect(error.code).toBe(409)
    expect(error.response.config.silent).toBe(true)
  })

  it('响应不是 ResponseWrapper 时抛出 AxiosError，而不是 BusinessError', async () => {
    const error = await request
      .get<never>({ url: '/anything', adapter: respondWith('<!doctype html>') })
      .catch((e: AxiosError) => e)
    expect(error).toBeInstanceOf(AxiosError)
    expect(error.code).toBe(AxiosError.ERR_BAD_RESPONSE)
    expect(error.response?.status).toBe(200)
  })
})
