<script setup>
/**
 * 资产健康度评分环（ECharts gauge）
 */
import { watch, computed } from 'vue'
import { useECharts } from '../../composables/useECharts.js'

const props = defineProps({
  score: { type: Number, default: 0 },
  grade: { type: String, default: '' },
})

const { el, setOption } = useECharts()

const scoreColor = computed(() => {
  if (props.score >= 90) return '#3e8e5a'
  if (props.score >= 75) return 'var(--manor-green)'
  if (props.score >= 60) return '#f5b83d'
  return '#e0524d'
})

watch(
  [() => props.score, () => props.grade],
  ([score]) => {
    setOption({
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          radius: '92%',
          pointer: { show: false },
          progress: {
            show: true,
            roundCap: true,
            width: 9,
            itemStyle: { color: scoreColor.value },
          },
          axisLine: { lineStyle: { width: 9, color: [[1, '#eef0f2']] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            fontSize: 30,
            fontWeight: 'bolder',
            offsetCenter: [0, '-8%'],
            color: scoreColor.value,
            formatter: '{value}',
          },
          data: [{ value: score }],
        },
      ],
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="health-wrap">
    <div ref="el" class="health-chart"></div>
    <div class="health-grade" :style="{ color: scoreColor }">健康度{{ grade }}</div>
  </div>
</template>

<style scoped>
.health-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.health-chart {
  width: 100%;
  height: 118px;
}

.health-grade {
  margin-top: -6px;
  font-size: 12px;
  font-weight: 700;
}
</style>
