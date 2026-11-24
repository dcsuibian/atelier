import { CanceledError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import request, { isHandled, onRequestError } from '@/utils/http'

describe('request', () => {
  it('主动取消的请求不通知失败，但算作已处理', async () => {
    const handler = vi.fn()
    onRequestError(handler)
    const controller = new AbortController()
    controller.abort()
    const error = await request.get({ url: '/anything', signal: controller.signal }).catch(e => e)
    expect(error).toBeInstanceOf(CanceledError)
    expect(handler).not.toHaveBeenCalled()
    expect(isHandled(error)).toBe(true)
  })

  it('没经过 http 层的错误不算已处理', () => {
    expect(isHandled(new Error('别处的错误'))).toBe(false)
    expect(isHandled('不是对象')).toBe(false)
  })
})
