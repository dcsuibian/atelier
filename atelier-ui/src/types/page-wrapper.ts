/**
 * 后端分页结果。页码从 1 开始，不带 totalPages
 */
interface PageWrapper<T> {
  data: T[]
  total: number
  pageNumber: number
  pageSize: number
}

export type { PageWrapper }
