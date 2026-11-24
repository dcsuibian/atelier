import type { User } from './user'

/**
 * 项目。负责人只带 id、用户名与真实姓名，由后端联表查出
 */
interface Project {
  id: number
  name: string
  owner: ProjectOwner
  description: string
  createTime: number
  updateTime: number
}

type ProjectOwner = Pick<User, 'id' | 'name' | 'realName'>

/**
 * 项目列表的查询条件，对应后端 ProjectQo
 */
interface ProjectQuery {
  ownerId?: number
  /** 模糊匹配项目名称、描述，不区分大小写 */
  searchText?: string
}

export type { Project, ProjectOwner, ProjectQuery }
