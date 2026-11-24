import type { PageQuery, PageWrapper, Project, ProjectQuery } from '@/types'
import request from '@/utils/http'

/**
 * 新增与编辑时提交的项目。负责人只传 id；编辑走 PATCH，字段为 undefined 表示不修改
 */
type ProjectForm = Partial<Pick<Project, 'name' | 'description'> & { owner: { id: number } }>

export function getProjects(params: ProjectQuery & PageQuery): Promise<PageWrapper<Project>> {
  return request.get({
    url: '/projects',
    params,
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

export type { ProjectForm }
