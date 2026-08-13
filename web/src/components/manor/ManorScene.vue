<script setup>
/**
 * 庄园场景（SVG 手绘风）
 * - 天空/天气特效与当日行情联动（晴/雨/多云/彩虹/暴风雨）
 * - 地块按类型分组，植物生长阶段（种子/发芽/生长/成熟/枯萎）映射为表情与大小
 * - 点击植物 → 弹出关联理财产品详情（PlantCard）
 *
 * 【扩展点】生产环境：本场景由 Cocos Creator 游戏引擎渲染，
 * 组件接口保持（plants/weather/select 事件）不变即可平滑替换。
 */
import { computed } from 'vue'

const props = defineProps({
  plants: { type: Array, default: () => [] },
  weather: { type: Object, default: null },
  /** 已装备的商城装饰摆件（emoji + slot 坐标） */
  decorations: { type: Array, default: () => [] },
})
const emit = defineEmits(['select'])

/** 地块布局：3花园 + 2果园 + 1温室（植物按地块类型依次分配） */
const PLOT_LAYOUT = [
  { type: 'garden', x: 22, y: 262, w: 58, h: 46, label: '花园' },
  { type: 'garden', x: 96, y: 276, w: 58, h: 46, label: '花园' },
  { type: 'garden', x: 170, y: 262, w: 58, h: 46, label: '花园' },
  { type: 'orchard', x: 244, y: 276, w: 58, h: 46, label: '果园' },
  { type: 'orchard', x: 318, y: 262, w: 58, h: 46, label: '果园' },
]

const STAGE_SIZE = { seed: 17, sprout: 23, growing: 28, mature: 35, wilted: 26 }

const plots = computed(() => {
  const order = ['garden', 'orchard']
  const plantsByType = (t) => props.plants.filter((p) => p.plotType === t)
  const result = []
  let gi = 0
  let oi = 0
  for (const layout of PLOT_LAYOUT) {
    const bucket = layout.type === 'garden' ? plantsByType('garden') : plantsByType('orchard')
    const idx = layout.type === 'garden' ? gi++ : oi++
    const plant = bucket[idx] ?? null
    result.push({ ...layout, plant, order })
  }
  return result
})

const greenhousePlant = computed(() => props.plants.find((p) => p.plotType === 'greenhouse'))

const isRainy = computed(() => ['rainy', 'storm'].includes(props.weather?.code))

const sky = computed(() => {
  switch (props.weather?.code) {
    case 'rainy':
    case 'storm':
      return ['#cdd8e3', '#e8eef4']
    case 'rainbow':
      return ['#cfe8ff', '#eef8ff']
    default:
      return ['#dff3ff', '#f6fbff']
  }
})

/** 雨滴（位置确定性生成） */
const raindrops = Array.from({ length: 16 }, (_, i) => ({
  x: 12 + ((i * 23.7) % 350),
  delay: -((i * 0.21) % 1.6).toFixed(2),
  len: 14 + ((i * 7) % 10),
}))
</script>

<template>
  <div class="manor-scene">
    <svg viewBox="0 0 375 356" xmlns="http://www.w3.org/2000/svg" class="scene-svg">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="sky[0]" />
          <stop offset="100%" :stop-color="sky[1]" />
        </linearGradient>
        <linearGradient id="rainbowGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f44336" />
          <stop offset="30%" stop-color="#ffb300" />
          <stop offset="55%" stop-color="#4caf50" />
          <stop offset="75%" stop-color="#2196f3" />
          <stop offset="100%" stop-color="#9c27b0" />
        </linearGradient>
      </defs>

      <!-- 天空 -->
      <rect width="375" height="356" fill="url(#skyGrad)" />

      <!-- 太阳（晴/彩虹） -->
      <g v-if="['sunny', 'rainbow'].includes(weather?.code)" class="sun-group">
        <circle cx="304" cy="58" r="22" fill="#ffd54f" />
        <g class="sun-rays">
          <line
            v-for="i in 8"
            :key="i"
            x1="304"
            :y1="58 - 34"
            x2="304"
            :y2="58 - 42"
            stroke="#ffd54f"
            stroke-width="3"
            stroke-linecap="round"
            :transform="`rotate(${i * 45} 304 58)`"
          />
        </g>
      </g>

      <!-- 彩虹 -->
      <g v-if="weather?.code === 'rainbow'" class="rainbow">
        <path
          d="M 208 88 A 96 96 0 0 1 400 88"
          fill="none"
          stroke="url(#rainbowGrad)"
          stroke-width="7"
          stroke-linecap="round"
          opacity="0.85"
        />
        <path
          d="M 220 88 A 84 84 0 0 1 388 88"
          fill="none"
          stroke="#ffe082"
          stroke-width="3"
          stroke-linecap="round"
          opacity="0.7"
        />
      </g>

      <!-- 云 -->
      <g class="cloud" :class="{ dark: isRainy }">
        <ellipse cx="92" cy="46" rx="30" ry="13" :fill="isRainy ? '#b8c4d0' : '#ffffff'" />
        <ellipse cx="116" cy="40" rx="22" ry="12" :fill="isRainy ? '#aebcc9' : '#ffffff'" />
        <ellipse cx="70" cy="40" rx="18" ry="10" :fill="isRainy ? '#c3cdd8' : '#ffffff'" />
      </g>
      <g class="cloud cloud-slow" :class="{ dark: isRainy }">
        <ellipse cx="250" cy="26" rx="24" ry="10" :fill="isRainy ? '#c3cdd8' : '#ffffff'" />
        <ellipse cx="270" cy="22" rx="17" ry="9" :fill="isRainy ? '#b8c4d0' : '#ffffff'" />
      </g>

      <!-- 雨滴 -->
      <g v-if="isRainy" class="rain-layer">
        <line
          v-for="(d, i) in raindrops"
          :key="i"
          :x1="d.x"
          :y1="-20"
          :x2="d.x - 3"
          :y2="-20 + d.len"
          stroke="#7fa3c7"
          stroke-width="2"
          stroke-linecap="round"
          class="raindrop"
          :style="{ animationDelay: d.delay + 's' }"
        />
      </g>

      <!-- 温室（长期投资） -->
      <g class="greenhouse">
        <rect
          x="138"
          y="168"
          width="72"
          height="52"
          rx="6"
          fill="#dfeef2"
          stroke="#9cc0c9"
          stroke-width="2"
        />
        <path
          d="M 138 190 A 36 28 0 0 1 210 190 Z"
          fill="#f2fbff"
          stroke="#9cc0c9"
          stroke-width="2"
        />
        <line x1="174" y1="166" x2="174" y2="188" stroke="#9cc0c9" stroke-width="1.5" />
        <line x1="150" y1="178" x2="150" y2="188" stroke="#9cc0c9" stroke-width="1.5" />
        <line x1="198" y1="178" x2="198" y2="188" stroke="#9cc0c9" stroke-width="1.5" />
        <text
          v-if="greenhousePlant"
          x="174"
          y="164"
          text-anchor="middle"
          :font-size="STAGE_SIZE[greenhousePlant.stage] || 26"
          class="plant-emoji"
          @click="emit('select', greenhousePlant)"
        >
          {{ greenhousePlant.emoji }}
        </text>
        <text
          v-if="greenhousePlant"
          x="174"
          y="228"
          text-anchor="middle"
          font-size="9"
          fill="#5d7a85"
          class="plot-name"
        >
          {{ greenhousePlant.speciesName }}
        </text>
      </g>

      <!-- 后景草地 -->
      <ellipse cx="187" cy="252" rx="200" ry="34" fill="#b9d69b" />

      <!-- 地块 -->
      <g v-for="p in plots" :key="p.x" class="plot" @click="p.plant && emit('select', p.plant)">
        <rect
          :x="p.x"
          :y="p.y"
          :width="p.w"
          :height="p.h"
          rx="10"
          :fill="p.type === 'garden' ? '#c9a66b' : '#b68f56'"
          stroke="#a5824a"
          stroke-width="2"
        />
        <text
          :x="p.x + p.w / 2"
          :y="p.y - 5"
          text-anchor="middle"
          font-size="9"
          fill="#7d6a45"
          class="plot-label"
        >
          {{ p.label }}
        </text>
        <template v-if="p.plant">
          <text
            :x="p.x + p.w / 2"
            :y="p.y + 20"
            text-anchor="middle"
            :font-size="STAGE_SIZE[p.plant.stage] || 26"
            :opacity="p.plant.stage === 'wilted' ? 0.75 : 1"
            class="plant-emoji"
          >
            {{ p.plant.emoji }}
          </text>
          <text
            :x="p.x + p.w / 2"
            :y="p.y + p.h - 8"
            text-anchor="middle"
            font-size="9"
            fill="#5c4a2b"
            class="plot-name"
          >
            {{ p.plant.speciesName }}
          </text>
        </template>
        <text
          v-else
          :x="p.x + p.w / 2"
          :y="p.y + 24"
          text-anchor="middle"
          font-size="12"
          opacity="0.45"
        >
          +
        </text>
      </g>

      <!-- 前景草地 -->
      <rect x="0" y="308" width="375" height="48" fill="#a8c686" />

      <!-- 商城装饰摆件（装备后实景渲染） -->
      <g v-for="(d, i) in decorations" :key="d.id">
        <text
          :x="d.slot.x"
          :y="d.slot.y"
          text-anchor="middle"
          font-size="22"
          :class="'deco deco-' + i"
        >
          {{ d.emoji }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.manor-scene {
  border-radius: var(--radius);
  overflow: hidden;
  margin: 10px 12px;
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.06);
}

.scene-svg {
  display: block;
  width: 100%;
}

/* 太阳光晕旋转 */
.sun-rays {
  transform-box: fill-box;
  transform-origin: center;
  animation: spin 22s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 云缓慢漂移 */
.cloud {
  animation: drift 26s ease-in-out infinite alternate;
}

.cloud-slow {
  animation-duration: 38s;
  animation-delay: -12s;
}

@keyframes drift {
  from {
    transform: translateX(-14px);
  }
  to {
    transform: translateX(16px);
  }
}

/* 雨滴下落 */
.raindrop {
  animation: rainFall 1.5s linear infinite;
}

@keyframes rainFall {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  15% {
    opacity: 0.75;
  }
  85% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(400px);
    opacity: 0;
  }
}

/* 彩虹渐显 */
.rainbow {
  animation: fadeIn 1.2s ease both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 可点击植物 */
.plant-emoji {
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: sway 3.2s ease-in-out infinite;
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(-2.2deg);
  }
  50% {
    transform: rotate(2.2deg);
  }
}

.plot {
  cursor: pointer;
}

/* 装饰摆件轻微浮动 */
.deco {
  animation: decoFloat 3.6s ease-in-out infinite;
}

.deco-1 {
  animation-delay: -1.4s;
}

.deco-2 {
  animation-delay: -2.6s;
}

@keyframes decoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
</style>
