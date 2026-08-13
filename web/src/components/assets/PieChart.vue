<script setup>
/**
 * 资产配置环形饼图（ECharts）
 */
import { watch } from 'vue'
import { useECharts } from '../../composables/useECharts.js'
import { formatMoney } from '../../utils/format.js'

const props = defineProps({
  categories: { type: Array, default: () => [] },
})

const { el, setOption } = useECharts()

watch(
  () => props.categories,
  (cats) => {
    if (!cats.length) return
    setOption({
      tooltip: {
        trigger: 'item',
        formatter: (p) => `${p.name}<br/>${formatMoney(p.value)}（${p.percent}%）`,
        textStyle: { fontSize: 11 },
      },
      legend: {
        bottom: 0,
        left: 'center',
        itemWidth: 8,
        itemHeight: 8,
        icon: 'circle',
        textStyle: { fontSize: 10, color: '#8a8f99' },
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '72%'],
          center: ['50%', '42%'],
          itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
          label: { show: false },
          data: cats.map((c) => ({
            name: c.category,
            value: c.amount,
            itemStyle: { color: c.color },
          })),
        },
      ],
    })
  },
  { immediate: true },
)
</script>

<template>
  <div ref="el" style="width: 100%; height: 180px"></div>
</template>
