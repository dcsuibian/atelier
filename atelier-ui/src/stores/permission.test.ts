import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Permission } from '@/types'
import { usePermissionStore } from './permission'

const permission = (code: string, status: Permission['status'] = 'ENABLED'): Permission => ({
  id: 0,
  code,
  name: code,
  description: '',
  status,
  createTime: 0,
  updateTime: 0,
})

describe('permissionStore.check', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    usePermissionStore().set([permission('user:view'), permission('user:edit'), permission('role:view', 'DISABLED')])
  })

  it('undefined 与 null 视为不设限', () => {
    const store = usePermissionStore()
    expect(store.check(undefined)).toBe(true)
    expect(store.check(null)).toBe(true)
  })

  it('单个权限码看是否拥有', () => {
    const store = usePermissionStore()
    expect(store.check('user:view')).toBe(true)
    expect(store.check('user:delete')).toBe(false)
  })

  it('禁用的权限不算拥有', () => {
    expect(usePermissionStore().check('role:view')).toBe(false)
  })

  it('and 要求全部满足，or 只要其一', () => {
    const store = usePermissionStore()
    expect(store.check({ and: ['user:view', 'user:edit'] })).toBe(true)
    expect(store.check({ and: ['user:view', 'user:delete'] })).toBe(false)
    expect(store.check({ or: ['user:delete', 'user:edit'] })).toBe(true)
    expect(store.check({ or: ['user:delete', 'role:view'] })).toBe(false)
  })

  it('表达式可以嵌套', () => {
    const store = usePermissionStore()
    expect(store.check({ or: ['user:delete', { and: ['user:view', 'user:edit'] }] })).toBe(true)
    expect(store.check({ and: ['user:view', { or: ['user:delete', 'role:view'] }] })).toBe(false)
  })

  it('清空后什么都没有', () => {
    const store = usePermissionStore()
    store.clear()
    expect(store.check('user:view')).toBe(false)
  })
})
