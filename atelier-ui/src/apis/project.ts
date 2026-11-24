import type { PageWrapper, Project } from '@/types'
import request from '@/utils/http'

/**
 * 项目列表的查询条件，对应后端 ProjectQo
 */
interface ProjectQuery {
  ownerId?: number | null
  /** 模糊匹配项目名称、描述，不区分大小写 */
  searchText?: string | null
}

/**
 * 新增与编辑时提交的项目。负责人只传 id；编辑走 PATCH，字段为 undefined 表示不修改
 */
type ProjectForm = Partial<Pick<Project, 'name' | 'description'> & { owner: { id: number } }>

export function getProjects(query: ProjectQuery, pageNumber: number, pageSize: number): Promise<PageWrapper<Project>> {
  return request.get({
    url: '/projects',
    params: { ...query, pageNumber, pageSize },
  })
}

export function addProject(data: ProjectForm): Promise<Project> {
  return request.post({
    url: '/projects',
    data,
  })
}

export function editProjectPartially(id: number, data: ProjectForm): Promise<Project> {
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

export type { ProjectQuery, ProjectForm }
