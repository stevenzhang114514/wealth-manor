<script setup>
/**
 * AI 配置建议卡：风险预警 + 建议 + 一键优化（演示）
 */
import { formatMoney } from '../../utils/format.js'
import { toast } from '../../utils/toast.js'

defineProps({
  advice: { type: Object, default: null },
})

const emit = defineEmits(['optimize'])

const onOptimize = (advice) => {
  const plan = advice?.optimizePlan?.[0]
  if (plan) {
    toast(
      `已生成优化方案（演示）：${plan.action}「${plan.from}」${formatMoney(plan.amount)} 至「${plan.to}」`,
      'success',
    )
  }
  emit('optimize')
}
</script>

<template>
  <div v-if="advice" class="wm-card">
    <div class="card-title">🤖 AI 配置建议</div>

    <div v-for="(w, i) in advice.warnings" :key="'w' + i" class="advice-row warn">
      <span>⚠️</span>{{ w }}
    </div>
    <div v-for="(s, i) in advice.suggestions" :key="'s' + i" class="advice-row">
      <span>💡</span>{{ s }}
    </div>

    <div v-if="advice.optimizePlan?.length" class="opt-row">
      <span v-for="(p, i) in advice.optimizePlan" :key="i" class="opt-chip">
        {{ p.action }}：{{ p.from }}→{{ p.to }}
        {{ p.amount ? formatMoney(p.amount) : '定投' + formatMoney(p.monthly) + '/月' }}
      </span>
    </div>

    <button class="wm-btn wm-btn-block" @click="onOptimize(advice)">✨ 一键优化</button>
    <div class="disclaimer">{{ advice.disclaimer }}</div>
  </div>
</template>

<style scoped>
.advice-row {
  display: flex;
  gap: 6px;
  font-size: 11.5px;
  line-height: 1.65;
  color: #4b5563;
  margin-bottom: 7px;
}

.advice-row.warn {
  background: #fdeceb;
  border-radius: 10px;
  padding: 7px 9px;
  color: #9d3a34;
}

.opt-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.opt-chip {
  font-size: 10px;
  font-weight: 700;
  background: #eef6ee;
  color: var(--manor-green);
  padding: 3px 9px;
  border-radius: 999px;
}

.wm-btn-block {
  width: 100%;
  margin-top: 4px;
}

.disclaimer {
  font-size: 9.5px;
  color: #b0b5bd;
  text-align: center;
  margin-top: 7px;
}
</style>
