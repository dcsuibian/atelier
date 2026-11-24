import type { PageWrapper, Project } from '@/types'
import request from '@/utils/http'

/**
 * 项目列表的查询条件，对应后端 ProjectQo
 */
interface ProjectQo {
  ownerId?: number | null
  /** 模糊匹配项目名称、描述，不区分大小写 */
  searchText?: string | null
}

/**
 * 新增项目时提交的数据。负责人只传 id
 */
interface ProjectAddDto {
  name: string
  owner: { id: number }
  /** 不传当作空串 */
  description?: string
}

/**
 * 部分更新项目时提交的数据。字段为 undefined 表示不修改
 */
type ProjectEditPartiallyDto = Partial<ProjectAddDto>

export function getProjects(query: ProjectQo, pageNumber: number, pageSize: number): Promise<PageWrapper<Project>> {
  return request.get({
    url: '/projects',
    params: { ...query, pageNumber, pageSize },
  })
}

export function addProject(data: ProjectAddDto): Promise<Project> {
  return request.post({
    url: '/projects',
    data,
  })
}

export function editProjectPartially(id: number, data: ProjectEditPartiallyDto): Promise<Project> {
  return request.patch({
    url: `/projects/${id}`,
    data,
  })
}

export function deleteProjectById(id: number): Promise<void> {
  return request.delete({
    url: `/projects/${id}`,
  })
}

export type { ProjectQo, ProjectAddDto, ProjectEditPartiallyDto }
