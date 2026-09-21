import type { PageQuery, PageWrapper, Role, RoleQuery } from '@/types'
import request from '@/utils/http'

export function getRoles(params: RoleQuery & PageQuery): Promise<PageWrapper<Role>> {
  return request.get({
    url: '/roles',
    params,
  })
}
