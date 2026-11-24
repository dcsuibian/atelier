import { describe, expect, it } from 'vitest'
import type { AppRouteRecord } from '@/types'
import { normalizeRoutes } from '@/router/route-registry'

const page = () => Promise.resolve({})

describe('normalizeRoutes', () => {
  it('子路由的相对路径补全成完整路径，目录默认跳到第一个页面', () => {
    const routes: AppRouteRecord[] = [
      {
        path: '/system',
        name: 'System',
        meta: { title: '系统' },
        children: [
          { path: 'user', name: 'User', component: page, meta: { title: '用户' } },
          { path: 'role', name: 'Role', component: page, meta: { title: '角色' } },
        ],
      },
    ]
    const [system] = normalizeRoutes(routes)
    expect(system.children?.map(child => child.path)).toEqual(['/system/user', '/system/role'])
    expect(system.redirect).toBe('/system/user')
  })

  it('既没有组件也不是外链的叶子去掉，外链保留', () => {
    const routes: AppRouteRecord[] = [
      { path: '/broken', name: 'Broken', meta: { title: '坏的' } },
      { path: 'https://example.com', name: 'Link', meta: { title: '外链', link: 'https://example.com' } },
    ]
    expect(normalizeRoutes(routes).map(route => route.name)).toEqual(['Link'])
  })

  it('不改传入的路由配置', () => {
    const child: AppRouteRecord = { path: 'user', name: 'User', component: page, meta: { title: '用户' } }
    normalizeRoutes([{ path: '/system', name: 'System', meta: { title: '系统' }, children: [child] }])
    expect(child.path).toBe('user')
  })
})
