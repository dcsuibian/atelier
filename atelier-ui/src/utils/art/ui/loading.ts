/**
 * 全局 Loading 加载管理模块
 *
 * 提供统一的全屏加载动画管理
 *
 * ## 主要功能
 *
 * - 全屏 Loading 显示和隐藏
 * - 自动适配明暗主题背景色
 * - 自定义 SVG 加载动画
 * - 单例模式防止重复创建
 * - 锁定页面交互
 *
 * ## 使用场景
 *
 * - 页面初始化加载
 * - 大量数据请求
 * - 路由切换过渡
 * - 异步操作等待
 *
 * ## 特性
 *
 * - 自动检测当前主题并应用对应背景色
 * - 使用自定义 SVG 动画（四点旋转）
 * - 单例模式确保同时只有一个 Loading
 * - 提供便捷的显示/隐藏方法
 *
 * @module utils/ui/loading
 * @author Art Design Pro Team
 */
import { ElLoading } from 'element-plus'

// 自定义四点旋转SVG
export const fourDotsSpinnerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <style>
      .spinner {
        transform-origin: 20px 20px;
        animation: rotate 1.6s linear infinite;
      }
      .dot {
        fill: var(--theme-color);
        animation: fade 1.6s infinite;
      }
      .dot:nth-child(1) { animation-delay: 0s; }
      .dot:nth-child(2) { animation-delay: 0.5s; }
      .dot:nth-child(3) { animation-delay: 1s; }
      .dot:nth-child(4) { animation-delay: 1.5s; }
      @keyframes rotate {
        100% { transform: rotate(360deg); }
      }
      @keyframes fade {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
    <g class="spinner">
      <circle class="dot" cx="20" cy="8" r="4"/>
      <circle class="dot" cx="32" cy="20" r="4"/>
      <circle class="dot" cx="20" cy="32" r="4"/>
      <circle class="dot" cx="8" cy="20" r="4"/>
    </g>
  </svg>
`

/**
 * 获取当前主题对应的loading背景色
 * @returns 背景色字符串
 */
const getLoadingBackground = (): string => {
  const isDark = document.documentElement.classList.contains('dark')
  return isDark ? 'rgba(7, 7, 7, 0.85)' : '#fff'
}

const DEFAULT_LOADING_CONFIG = {
  lock: true,
  get background() {
    return getLoadingBackground()
  },
  svg: fourDotsSpinnerSvg,
  svgViewBox: '0 0 40 40',
  customClass: 'art-loading-fix',
} as const

interface LoadingInstance {
  close: () => void
}

let loadingInstance: LoadingInstance | null = null

export const loadingService = {
  /**
   * 显示 loading
   * @returns 关闭 loading 的函数
   */
  showLoading(): () => void {
    if (!loadingInstance) {
      // 每次显示时获取最新的配置，确保背景色与当前主题同步
      const config = {
        ...DEFAULT_LOADING_CONFIG,
        background: getLoadingBackground(),
      }
      loadingInstance = ElLoading.service(config)
    }
    return () => this.hideLoading()
  },

  /**
   * 隐藏 loading
   */
  hideLoading(): void {
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  },
}
