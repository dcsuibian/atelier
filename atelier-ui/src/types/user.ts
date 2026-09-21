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

export type { User, UserGender, UserStatus }
