/**
 * API 接口类型定义模块
 *
 * atelier：只剩 ADP 上游代码（useTable、tableUtils）还在引用的 Api.Common。
 * 与后端对接的类型不放这里，平铺在 src/types/ 下（User、Role、PageWrapper 等）
 *
 * - 使用全局命名空间，无需导入即可使用
 *
 * @module types/api/api
 * @author Art Design Pro Team
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }
}
