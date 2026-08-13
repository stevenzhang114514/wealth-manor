<script setup>
/**
 * 财富树（SVG 资产可视化）
 * 树干 = 总资产；四大分支 = 现金存款/权益类/基金/不动产（粗细∝金额）；
 * 树冠 = 净资产总额；树叶茂密度 = 资产配置均衡度（健康分）；高度 = 长期增长趋势
 */
import { computed } from 'vue'
import { formatWan, formatPct } from '../../utils/format.js'

const props = defineProps({
  overview: { type: Object, default: null },
  healthScore: { type: Number, default: 75 },
})

const MAIN_BRANCHES = ['现金及存款', '权益类', '基金理财', '不动产']

const branches = computed(() => {
  const cats = props.overview?.categories ?? []
  const selected = MAIN_BRANCHES.map((name) => cats.find((c) => c.category === name)).filter(
    Boolean,
  )
  const max = Math.max(...selected.map((c) => c.amount), 1)
  const angles = [150, 120, 60, 30]
  const trunkTop = { x: 150, y: 96 }
  return selected.map((c, i) => {
    const ratio = c.amount / max
    const len = 52 + ratio * 96
    const rad = (angles[i] * Math.PI) / 180
    const end = {
      x: trunkTop.x + Math.cos(rad) * len,
      y: trunkTop.y - Math.sin(rad) * len,
    }
    const label = {
      x: trunkTop.x + Math.cos(rad) * (len + 20),
      y: trunkTop.y - Math.sin(rad) * (len + 20),
    }
    return { ...c, ratio, end, label, width: 4.5 + ratio * 9 }
  })
})

/** 树叶：数量∝健康分，位置确定性分布 */
const leaves = computed(() => {
  const n = 16 + Math.round((props.healthScore / 100) * 14)
  const cx = 150
  const cy = 62
  const r = 44
  return Array.from({ length: n }, (_, i) => {
    const a = i * 2.39996 // 黄金角
    const d = r * Math.sqrt((i + 0.5) / n)
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, r: 3 + ((i * 13) % 5) }
  })
})

const trendPct = computed(() => {
  const t = props.overview?.todayChangePct ?? 0
  return formatPct(t)
})
</script>

<template>
  <div class="wealth-tree">
    <svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">
      <!-- 树冠 -->
      <circle cx="150" cy="62" r="58" fill="rgba(126,180,93,0.14)" />
      <circle
        v-for="(l, i) in leaves"
        :key="i"
        :cx="l.x"
        :cy="l.y"
        :r="l.r"
        :fill="i % 3 === 0 ? '#4e8c4e' : i % 3 === 1 ? '#7ba05b' : '#9dc07a'"
      />
      <text x="150" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="#4e8c4e">
        树冠 · 净资产 {{ formatWan(overview?.netWorth ?? 0) }}
      </text>

      <!-- 分支 -->
      <g v-for="b in branches" :key="b.category">
        <line
          x1="150"
          y1="96"
          :x2="b.end.x"
          :y2="b.end.y"
          :stroke="b.color"
          :stroke-width="b.width"
          stroke-linecap="round"
        />
        <circle :cx="b.end.x" :cy="b.end.y" :r="7 + b.ratio * 7" :fill="b.color" opacity="0.85" />
        <text :x="b.label.x" :y="b.label.y" text-anchor="middle" font-size="9" fill="#5d6672">
          {{ b.category }} {{ Math.round(b.ratio * 100) }}%
        </text>
      </g>

      <!-- 树干 -->
      <path
        d="M 138 96 C 138 140 142 168 140 196 L 160 196 C 158 168 162 140 162 96 Z"
        fill="#a5824a"
        stroke="#8c6c3c"
        stroke-width="1.5"
      />
      <text x="150" y="222" text-anchor="middle" font-size="10" font-weight="700" fill="#7d6a45">
        树干 · 总资产 {{ formatWan(overview?.totalAssets ?? 0) }}
      </text>

      <!-- 高度 = 长期趋势 -->
      <text x="150" y="238" text-anchor="middle" font-size="9" fill="#8a8f99">
        📈 高度 = 长期财富趋势（近30日 {{ trendPct }}）
      </text>
    </svg>
  </div>
</template>

<style scoped>
.wealth-tree svg {
  display: block;
  width: 100%;
}
</style>
