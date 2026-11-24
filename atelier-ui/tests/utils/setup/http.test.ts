import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { BusinessError } from '@/utils/http'
import { messageOf } from '@/utils/setup/http'

vi.mock('@/locales', () => ({ $t: (key: string) => key }))
// 只测 messageOf，同文件里接线用到的依赖不需要真的加载
vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn() } }))
vi.mock('@/stores/session', () => ({ useSessionStore: vi.fn() }))

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

  it('业务失败用后端的文案，文案为空时说明响应格式不对', () => {
    expect(messageOf(new BusinessError('角色名称已存在', 409))).toBe('角色名称已存在')
    expect(messageOf(new BusinessError('', undefined))).toBe('httpMsg.invalidResponse')
  })

  it('其他错误沿用自身的 message', () => {
    expect(messageOf(new Error('出错了'))).toBe('出错了')
    expect(messageOf('奇怪的东西')).toBe('httpMsg.requestFailed')
  })
})
