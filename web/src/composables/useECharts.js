/**
 * ECharts 挂载组合式函数
 * 图表在挂载后初始化；数据未到达前 setOption 会被暂存，挂载完成后自动补刷。
 */
import * as echarts from 'echarts'
import { onMounted, onBeforeUnmount, ref } from 'vue'

export function useECharts() {
  const el = ref(null)
  let chart = null
  let pending = null

  const setOption = (option) => {
    if (chart) {
      chart.setOption(option)
    } else {
      pending = option
    }
  }

  onMounted(() => {
    chart = echarts.init(el.value)
    if (pending) {
      chart.setOption(pending)
      pending = null
    }
  })

  onBeforeUnmount(() => {
    chart?.dispose()
    chart = null
  })

  return { el, setOption }
}
