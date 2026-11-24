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

export type { Project, ProjectOwner }
