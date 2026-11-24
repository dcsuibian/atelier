<!-- k线图表 -->
<template>
  <!-- 定位交给外层（卡片里是 absolute），relative 放在内层 -->
  <div class="relative w-full" :style="props.height ? { height: props.height } : undefined" v-loading="props.loading">
    <div class="relative size-full">
      <div v-if="isEmpty" class="absolute inset-0 flex-cc text-xs" :style="{ color: isDark ? '#555555' : '#B3B2B2' }">
        {{ $t('common.noData') }}
      </div>
      <!-- autoresize 用 ResizeObserver 盯着容器，窗口缩放、菜单收起都会跟着重排 -->
      <VChart v-else :option="option" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { CandlestickChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { vLoading } from 'element-plus'
import type { EChartsOption } from 'echarts'
import { useI18n } from 'vue-i18n'
import { useChartOps, useChart } from '@/composables/art/use-chart'
import type { KLineChartProps } from '../types'

use([CanvasRenderer, CandlestickChart, GridComponent, TooltipComponent, DataZoomComponent])

defineOptions({ name: 'ArtKLineChart' })

const { t } = useI18n()

const props = withDefaults(defineProps<KLineChartProps>(), {
  // 基础配置
  height: useChartOps().chartHeight,
  loading: false,
  isEmpty: false,
  colors: () => useChartOps().colors,

  // 数据配置
  data: () => [],
  showDataZoom: false,
  dataZoomStart: 0,
  dataZoomEnd: 100,
})

// 获取实际使用的颜色
const getActualColors = () => {
  const defaultUpColor = '#4C87F3'
  const defaultDownColor = '#8BD8FC'

  return {
    upColor: props.colors?.[0] || defaultUpColor,
    downColor: props.colors?.[1] || defaultDownColor,
  }
}

// 使用新的图表组件抽象
const {
  option,
  isEmpty,
  getAxisLineStyle,
  getAxisLabelStyle,
  getAxisTickStyle,
  getSplitLineStyle,
  getAnimationConfig,
  getTooltipStyle,
  isDark,
} = useChart({
  props,
  checkEmpty: () => {
    return (
      !props.data?.length ||
      props.data.every(item => item.open === 0 && item.close === 0 && item.high === 0 && item.low === 0)
    )
  },
  generateOptions: (): EChartsOption => {
    const { upColor, downColor } = getActualColors()

    return {
      grid: {
        top: 20,
        right: 20,
        bottom: props.showDataZoom ? 80 : 20,
        left: 20,
        containLabel: true,
      },
      tooltip: getTooltipStyle('axis', {
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: Array<{ name: string; data: number[] }>) => {
          const param = params[0]
          const data = param.data
          return `
              <div style="padding: 5px;">
                <div><strong>${t('chart.kLine.time')}</strong>${param.name}</div>
                <div><strong>${t('chart.kLine.open')}</strong>${data[0]}</div>
                <div><strong>${t('chart.kLine.close')}</strong>${data[1]}</div>
                <div><strong>${t('chart.kLine.low')}</strong>${data[2]}</div>
                <div><strong>${t('chart.kLine.high')}</strong>${data[3]}</div>
              </div>
            `
        },
      }),
      xAxis: {
        type: 'category',
        data: props.data.map(item => item.time),
        axisTick: getAxisTickStyle(),
        axisLine: getAxisLineStyle(true),
        axisLabel: getAxisLabelStyle(true),
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: getAxisLabelStyle(true),
        axisLine: getAxisLineStyle(true),
        splitLine: getSplitLineStyle(true),
      },
      series: [
        {
          type: 'candlestick',
          data: props.data.map(item => [item.open, item.close, item.low, item.high]),
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor,
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          ...getAnimationConfig(),
        },
      ],
      dataZoom: props.showDataZoom
        ? [
            {
              type: 'inside',
              start: props.dataZoomStart,
              end: props.dataZoomEnd,
            },
            {
              show: true,
              type: 'slider',
              top: '90%',
              start: props.dataZoomStart,
              end: props.dataZoomEnd,
            },
          ]
        : undefined,
    }
  },
})
</script>
