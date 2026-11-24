/**
 * 国际化配置
 *
 * 基于 vue-i18n 实现的多语言国际化解决方案。
 * 支持中文和英文切换，自动从本地存储恢复用户的语言偏好。
 *
 * ## 主要功能
 *
 * - 多语言支持 - 支持中文（简体）和英文两种语言
 * - 语言切换 - 运行时动态切换语言，无需刷新页面
 * - 持久化存储 - 自动保存和恢复用户的语言偏好
 * - 全局注入 - 在任何组件中都可以使用 $t 函数进行翻译
 * - 类型安全 - 提供 TypeScript 类型支持
 *
 * ## 支持的语言
 *
 * - zh: 简体中文
 * - en: English
 *
 * @module locales
 * @author Art Design Pro Team
 */

import { createI18n } from 'vue-i18n'
import type { I18n, I18nOptions } from 'vue-i18n'
import { Language } from '@/constants/app'
import { LOCAL_STORAGE_KEYS } from '@/constants/storage-keys'
import { isObject } from '@/utils/is'

// 同步导入语言文件
import enMessages from './langs/en-us.json'
import zhMessages from './langs/zh-cn.json'

/**
 * 语言消息对象
 */
const messages = {
  [Language.EN_US]: enMessages,
  [Language.ZH_CN]: zhMessages,
}

/**
 * 语言选项列表
 * 用于语言切换下拉框
 */
export const languageOptions = [
  { value: Language.ZH_CN, label: '简体中文' },
  { value: Language.EN_US, label: 'English' },
]

/**
 * 读出上次选的语言。i18n 要在 store 建立之前就定好语言，所以直接读设置 store 持久化的那份
 */
const getDefaultLanguage = (): Language => {
  try {
    const setting: unknown = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SETTING) ?? 'null')
    const language = isObject(setting) ? setting.language : undefined
    if (Object.values<unknown>(Language).includes(language)) {
      return language as Language
    }
  } catch {
    // 存坏了就当没存过
  }
  return Language.ZH_CN
}

/**
 * i18n 配置选项
 */
const i18nOptions: I18nOptions = {
  locale: getDefaultLanguage(),
  legacy: false,
  globalInjection: true,
  fallbackLocale: Language.ZH_CN,
  messages,
}

/**
 * i18n 实例
 */
const i18n: I18n = createI18n(i18nOptions)

/**
 * 翻译函数类型
 */
interface Translation {
  (key: string): string
}

/**
 * 全局翻译函数
 * 可在任何地方使用，无需导入 useI18n
 */
export const $t = i18n.global.t as Translation

export default i18n
