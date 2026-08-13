<script setup>
/**
 * 庄园等级与经验条
 */
import { computed } from 'vue'

const props = defineProps({
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  expToNext: { type: Number, default: 100 },
  stageName: { type: String, default: '' },
})

const pct = computed(() => Math.min(100, Math.round((props.exp / props.expToNext) * 100)))
</script>

<template>
  <div class="level-bar">
    <span class="lv-badge">Lv.{{ level }}</span>
    <div class="bar-track">
      <div class="bar-fill" :style="{ width: pct + '%' }"></div>
    </div>
    <span class="lv-exp">{{ exp }}/{{ expToNext }}</span>
    <span class="lv-stage">{{ stageName }}</span>
  </div>
</template>

<style scoped>
.level-bar {
  display: flex;
  align-items: center;
  gap: 7px;
}

.lv-badge {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gold), #e8a02e);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
}

.bar-track {
  flex: 1;
  height: 7px;
  background: #e8ecf0;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--manor-green), var(--manor-green-light));
  transition: width 0.4s ease;
}

.lv-exp {
  font-size: 10px;
  color: var(--text-sub);
  flex-shrink: 0;
}

.lv-stage {
  font-size: 10px;
  font-weight: 700;
  color: var(--manor-green);
  flex-shrink: 0;
}
</style>
