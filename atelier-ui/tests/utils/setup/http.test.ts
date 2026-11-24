import {
  AxiosError,
  CanceledError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request, { BusinessError } from '@/utils/http'
import { isHandled, messageOf, setupHttp } from '@/utils/setup/http'

const { expire, showError } = vi.hoisted(() => ({ expire: vi.fn(), showError: vi.fn() }))

vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('element-plus', () => ({ ElMessage: { error: showError } }))
vi.mock('@/stores/session', () => ({ useSessionStore: () => ({ expire }) }))

const config = { headers: {} } as InternalAxiosRequestConfig

function fakeResponse(status: number, data: unknown = '', requestConfig = config): AxiosResponse {
  return { status, data, headers: {}, config: requestConfig, statusText: '' }
}

function responseError(status: number, data: unknown = ''): AxiosError {
  return new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_RESPONSE',
    config,
    {},
    fakeResponse(status, data),
  )
}

function businessError(message: string, code: number): BusinessError {
  return new BusinessError(message, code, fakeResponse(200))
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

  it('业务失败用后端的文案，文案为空时给通用提示', () => {
    expect(messageOf(businessError('角色名称已存在', 409))).toBe('角色名称已存在')
    expect(messageOf(businessError('', 400))).toBe('httpMsg.requestFailed')
  })

  it('2xx 还失败的，说明响应格式不对', () => {
    expect(messageOf(responseError(200, '<!doctype html>'))).toBe('httpMsg.invalidResponse')
  })

  it('其他错误沿用自身的 message', () => {
    expect(messageOf(new Error('出错了'))).toBe('出错了')
    expect(messageOf('奇怪的东西')).toBe('httpMsg.requestFailed')
  })
})

/** 不发真请求，直接以这个状态码失败 */
function failWith(status: number): AxiosAdapter {
  return async requestConfig => {
    throw new AxiosError('failed', 'ERR_BAD_RESPONSE', requestConfig, {}, fakeResponse(status, '', requestConfig))
  }
}

describe('setupHttp', () => {
  beforeAll(() => {
    setupHttp()
  })

  beforeEach(() => {
    expire.mockReset()
    showError.mockReset()
  })

  it('业务失败经过拆包装后照样弹提示，并算作已处理', async () => {
    const adapter: AxiosAdapter = async requestConfig =>
      fakeResponse(200, { code: 409, message: '名称已存在' }, requestConfig)
    const error = await request.get({ url: '/anything', adapter }).catch(e => e)
    expect(showError).toHaveBeenCalledWith('名称已存在')
    expect(isHandled(error)).toBe(true)
  })

  it('silent 的不弹提示，也不算已处理', async () => {
    const error = await request.get({ url: '/anything', silent: true, adapter: failWith(500) }).catch(e => e)
    expect(showError).not.toHaveBeenCalled()
    expect(isHandled(error)).toBe(false)
  })

  it('同时到达的 401 只过期一次，不弹失败提示', async () => {
    let finish = (): void => {}
    expire.mockReturnValue(new Promise<void>(resolve => (finish = resolve)))
    await Promise.all([
      request.get({ url: '/a', adapter: failWith(401) }).catch(() => {}),
      request.get({ url: '/b', adapter: failWith(401) }).catch(() => {}),
    ])
    finish()
    expect(expire).toHaveBeenCalledTimes(1)
    expect(showError).not.toHaveBeenCalled()
  })

  it('主动取消的不弹提示，但算作已处理', async () => {
    const controller = new AbortController()
    controller.abort()
    const error = await request.get({ url: '/anything', signal: controller.signal }).catch(e => e)
    expect(error).toBeInstanceOf(CanceledError)
    expect(showError).not.toHaveBeenCalled()
    expect(isHandled(error)).toBe(true)
  })

  it('不是请求错误的不算已处理', () => {
    expect(isHandled(new Error('别处的错误'))).toBe(false)
    expect(isHandled('不是对象')).toBe(false)
  })
})
