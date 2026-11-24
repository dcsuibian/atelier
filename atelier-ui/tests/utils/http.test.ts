import { AxiosError, CanceledError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import request, { messageOf } from '@/utils/http'

vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn() } }))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))

const config = { headers: {} } as InternalAxiosRequestConfig

function responseError(status: number, data: unknown = ''): AxiosError {
  const response = { status, data, headers: {}, config, statusText: '' } as AxiosResponse
  return new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', config, {}, response)
}

describe('messageOf', () => {
  it('按状态码给出提示，而不是 axios 的英文原文', () => {
    expect(messageOf(responseError(502, '<html>Bad Gateway</html>'))).toBe('httpMsg.badGateway')
    expect(messageOf(responseError(404))).toBe('httpMsg.notFound')
  })

  it('未列出的状态码给通用提示', () => {
    expect(messageOf(responseError(418))).toBe('httpMsg.requestFailed')
  })

  it('响应体里有后端给的 message 时优先用它', () => {
    expect(messageOf(responseError(500, { code: 500, message: '服务器内部错误' }))).toBe('服务器内部错误')
  })

  it('没有响应：区分超时与网络错误', () => {
    expect(messageOf(new AxiosError('timeout', AxiosError.ECONNABORTED, config, {}))).toBe('httpMsg.requestTimeout')
    expect(messageOf(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {}))).toBe('httpMsg.networkError')
  })

  it('请求没发出去算配置错误', () => {
    expect(messageOf(new AxiosError('Invalid URL', AxiosError.ERR_INVALID_URL, config))).toBe(
      'httpMsg.requestConfigError',
    )
  })

  it('非 axios 错误沿用自身的 message', () => {
    expect(messageOf(new Error('业务失败'))).toBe('业务失败')
    expect(messageOf('奇怪的东西')).toBe('httpMsg.requestFailed')
  })
})

describe('request', () => {
  it('主动取消的请求不弹提示', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(request.get({ url: '/anything', signal: controller.signal })).rejects.toBeInstanceOf(CanceledError)
    expect(ElMessage.error).not.toHaveBeenCalled()
  })
})
