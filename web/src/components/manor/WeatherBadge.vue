<script setup>
/**
 * 天气徽章：庄园天气 = 当日持仓盈亏映射（晴/雨/多云/彩虹/暴风雨）
 */
import { formatPct } from '../../utils/format.js'

defineProps({
  weather: { type: Object, default: null },
})
</script>

<template>
  <div v-if="weather" class="weather-badge" :data-weather="weather.code">
    <span class="w-icon">{{ weather.icon }}</span>
    <span class="w-text">
      {{ weather.label }}
      <em :class="weather.changePct >= 0 ? 'up' : 'down'">
        {{ weather.changePct >= 0 ? '+' : '' }}{{ formatPct(weather.changePct) }}
      </em>
    </span>
  </div>
</template>

<style scoped>
.weather-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #e8ecf0;
  border-radius: 999px;
  padding: 4px 11px;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.06);
}

.w-icon {
  font-size: 16px;
}

.w-text {
  font-size: 12px;
  font-weight: 700;
}

.w-text em {
  font-style: normal;
  margin-left: 4px;
  font-size: 11px;
}
</style>
