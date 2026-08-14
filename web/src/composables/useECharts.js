/**
 * ECharts 挂载组合式函数
 * 图表在挂载后初始化；数据未到达前 setOption 会被暂存，挂载完成后自动补刷。
 * ResizeObserver 监听容器尺寸（桌面手机框缩放/横竖屏切换时图表自适应）。
 */
import * as echarts from 'echarts'
import { onMounted, onBeforeUnmount, ref } from 'vue'

export function useECharts() {
  const el = ref(null)
  let chart = null
  let pending = null
  let observer = null

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
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => chart?.resize())
      observer.observe(el.value)
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
    chart?.dispose()
    chart = null
  })

  return { el, setOption }
}
