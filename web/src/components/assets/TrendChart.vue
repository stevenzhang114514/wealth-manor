<script setup>
/**
 * 近30天净资产趋势折线图（ECharts）
 */
import { watch } from 'vue'
import { useECharts } from '../../composables/useECharts.js'
import { formatWan } from '../../utils/format.js'

const props = defineProps({
  points: { type: Array, default: () => [] },
})

const { el, setOption } = useECharts()

watch(
  () => props.points,
  (pts) => {
    if (!pts.length) return
    setOption({
      grid: { left: 8, right: 12, top: 14, bottom: 22 },
      tooltip: {
        trigger: 'axis',
        textStyle: { fontSize: 11 },
        formatter: (params) => {
          const p = params[0]
          return `${p.axisValue}<br/>净资产 ${formatWan(p.value)}`
        },
      },
      xAxis: {
        type: 'category',
        data: pts.map((p) => p.date.slice(5)),
        axisLabel: { fontSize: 9, color: '#8a8f99', interval: 6 },
        axisLine: { lineStyle: { color: '#e8ecf0' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 9, color: '#8a8f99', formatter: (v) => formatWan(v) },
        splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } },
        scale: true,
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: pts.map((p) => p.netWorth),
          lineStyle: { width: 2.5, color: '#c8102e' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(200,16,46,0.22)' },
                { offset: 1, color: 'rgba(200,16,46,0.02)' },
              ],
            },
          },
        },
      ],
    })
  },
  { immediate: true },
)
</script>

<template>
  <div ref="el" style="width: 100%; height: 165px"></div>
</template>
