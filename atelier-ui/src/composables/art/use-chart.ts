import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@/stores/setting'
import { getCssVar } from '@/utils/art/ui'

type LegendPosition = 'bottom' | 'top' | 'left' | 'right'

/**
 * 图表的公共外观。颜色取自 CSS 变量，调用时才读，所以换主题色后新生成的配置会跟上
 */
export const useChartOps = () => ({
  chartHeight: '16rem',
  fontSize: 13,
  fontColor: '#999',
  themeColor: getCssVar('--el-color-primary-light-1'),
  colors: [getCssVar('--el-color-primary-light-1'), '#4ABEFF', '#EDF2FF', '#14DEBA', '#FFAF20', '#FA8A6C', '#FFAF20'],
})

interface UseChartOptions {
  /** 组件的 props，只看其中的 isEmpty */
  props?: { isEmpty?: boolean }
  /** 按数据判断是否为空，为空时显示「暂无数据」而不是空坐标系 */
  checkEmpty?: () => boolean
  generateOptions: () => EChartsOption
}

/**
 * 生成图表配置，交给各图表组件里的 VChart 渲染
 *
 * option 是 computed：数据、明暗主题一变就重算，vue-echarts 会自动 setOption；
 * 尺寸变化（窗口、菜单收起）由 VChart 的 autoresize 处理，这里都不用管
 */
export function useChart({ props, checkEmpty, generateOptions }: UseChartOptions) {
  const { isDark } = storeToRefs(useSettingStore())

  const isEmpty = computed(() => Boolean(props?.isEmpty) || (checkEmpty?.() ?? false))
  const option = computed<EChartsOption>(() => (isEmpty.value ? {} : generateOptions()))

  const lineColor = () => (isDark.value ? '#444' : '#EDEDED')

  const getAxisLineStyle = (show = true) => ({
    show,
    lineStyle: { color: lineColor(), width: 1 },
  })

  const getSplitLineStyle = (show = true) => ({
    show,
    lineStyle: { color: lineColor(), width: 1, type: 'dashed' as const },
  })

  const getAxisLabelStyle = (show = true) => {
    const { fontColor, fontSize } = useChartOps()
    return { show, color: fontColor, fontSize }
  }

  const getAxisTickStyle = () => ({ show: false })

  const getAnimationConfig = (animationDelay = 50, animationDuration = 1500) => ({
    animationDelay: (idx: number) => idx * animationDelay + 200,
    animationDuration: (idx: number) => animationDuration - idx * 50,
    animationEasing: 'quarticOut' as const,
  })

  const getTooltipStyle = (trigger: 'item' | 'axis' = 'axis', customOptions: Record<string, unknown> = {}) => ({
    trigger,
    backgroundColor: isDark.value ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: isDark.value ? '#333' : '#ddd',
    borderWidth: 1,
    textStyle: { color: isDark.value ? '#fff' : '#333' },
    ...customOptions,
  })

  const getLegendStyle = (position: LegendPosition = 'bottom', customOptions: Record<string, unknown> = {}) => {
    const base = {
      textStyle: { color: isDark.value ? '#fff' : '#333' },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
      icon: 'roundRect',
      ...customOptions,
    }
    switch (position) {
      case 'top':
        return { ...base, top: 0, left: 'center', orient: 'horizontal' as const }
      case 'left':
        return { ...base, left: 0, top: 'center', orient: 'vertical' as const }
      case 'right':
        return { ...base, right: 0, top: 'center', orient: 'vertical' as const }
      default:
        return { ...base, bottom: 0, left: 'center', orient: 'horizontal' as const }
    }
  }

  /** 有图例时给它在对应方向上让出位置 */
  const getGridWithLegend = (
    showLegend: boolean,
    legendPosition: LegendPosition = 'bottom',
    baseGrid: Record<string, unknown> = {},
  ) => {
    const grid = { top: 15, right: 15, bottom: 8, left: 0, containLabel: true, ...baseGrid }
    if (!showLegend) {
      return grid
    }
    const room = { bottom: { bottom: 40 }, top: { top: 40 }, left: { left: 120 }, right: { right: 120 } }
    return { ...grid, ...room[legendPosition] }
  }

  return {
    isDark,
    isEmpty,
    option,
    getAxisLineStyle,
    getSplitLineStyle,
    getAxisLabelStyle,
    getAxisTickStyle,
    getAnimationConfig,
    getTooltipStyle,
    getLegendStyle,
    getGridWithLegend,
  }
}
