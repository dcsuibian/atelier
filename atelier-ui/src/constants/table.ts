/**
 * 表格尺寸
 *
 * @module constants/table
 * @author Art Design Pro Team
 */

export const TableSizeEnum = {
  DEFAULT: 'default',
  SMALL: 'small',
  LARGE: 'large',
} as const
export type TableSizeEnum = (typeof TableSizeEnum)[keyof typeof TableSizeEnum]
