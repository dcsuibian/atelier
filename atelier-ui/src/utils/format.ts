/**
 * 展示用的格式化。日期时间用固定格式，不随语言切换
 */
import dayjs, { type Dayjs } from 'dayjs'
import { isNullish } from '@/utils/is'

type DateInput = number | Date | Dayjs | null | undefined

/** 空值显示的占位 */
const EMPTY = '-'

export function formatDateTime(value: DateInput): string {
  return isNullish(value) ? EMPTY : dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}

export function formatDate(value: DateInput): string {
  return isNullish(value) ? EMPTY : dayjs(value).format('YYYY-MM-DD')
}

export function formatTime(value: DateInput): string {
  return isNullish(value) ? EMPTY : dayjs(value).format('HH:mm:ss')
}
