/**
 * 用户。字段与后端保持一致：时间是毫秒时间戳，枚举取 Java 枚举名
 *
 * 密码只进不出（后端标了 WRITE_ONLY），任何响应里都没有，所以这里不列
 */
interface User {
  id: number
  name: string
  phoneNumber: string | null
  realName: string
  avatar: string | null
  email: string | null
  gender: UserGender
  status: UserStatus
  createTime: number
  updateTime: number
}

type UserGender = 'MALE' | 'FEMALE' | 'UNKNOWN'

type UserStatus = 'ENABLED' | 'DISABLED'

/**
 * 用户列表的查询条件，对应后端 UserQo
 */
interface UserQuery {
  status?: UserStatus
  /** 模糊匹配用户名、真实姓名、手机号，不区分大小写 */
  searchText?: string
}

export type { User, UserGender, UserStatus, UserQuery }
