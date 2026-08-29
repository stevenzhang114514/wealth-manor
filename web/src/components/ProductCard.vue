<script setup>
/**
 * 金融产品英雄卡（王者荣耀式卡面）：
 * 头像 + 风险等级 + 六维属性（收益/风险/流动性/税收/期限/起投）+ 「特殊情况」技能条
 * lock 时显示锁定遮罩（风评不足 / 资金不足）
 */
defineProps({
  product: { type: Object, required: true },
})
const emit = defineEmits(['select'])

const RISK_COLORS = { R1: '#34c759', R2: '#5ac8fa', R3: '#ff9500', R4: '#ff3b30', R5: '#af52de' }

const liqLabel = (p) => p.liquidity?.label ?? 'T+1'

const attrs = (p) => [
  { icon: '📈', label: '年化收益', value: `${p.yieldBase}%` },
  { icon: '⚠️', label: '风险等级', value: p.riskLevel, color: RISK_COLORS[p.riskLevel] },
  { icon: '💧', label: '流动性', value: liqLabel(p) },
  { icon: '🧾', label: '税收', value: p.taxLabel },
  { icon: '📅', label: '期限', value: p.termMonths ? `${p.termMonths}个月` : '无固定期限' },
  { icon: '💰', label: '起投', value: `¥${p.minAmount.toLocaleString('zh-CN')}` },
]
</script>

<template>
  <div class="product-card" :class="{ locked: !!product.lock }" @click="emit('select', product)">
    <!-- 头像与名称 -->
    <div class="pc-head">
      <div
        class="pc-avatar"
        :style="{ background: (RISK_COLORS[product.riskLevel] || '#999') + '22' }"
      >
        {{ product.emoji }}
      </div>
      <div class="pc-title">
        <div class="pc-name">{{ product.name }}</div>
        <div class="pc-cat">{{ product.category }}</div>
      </div>
      <span class="pc-risk" :style="{ color: RISK_COLORS[product.riskLevel] }">{{
        product.riskLevel
      }}</span>
    </div>

    <!-- 六维属性 -->
    <div class="pc-attrs">
      <div v-for="a in attrs(product)" :key="a.label" class="pc-attr">
        <span class="pa-label">{{ a.icon }} {{ a.label }}</span>
        <span class="pa-value" :style="a.color ? { color: a.color } : {}">{{ a.value }}</span>
      </div>
    </div>

    <!-- 特殊情况（技能） -->
    <div class="pc-skill">
      <span class="ps-tag">⚡ {{ product.special.label }}</span>
      <span class="ps-desc">{{ product.special.desc }}</span>
    </div>

    <!-- 锁定遮罩 -->
    <div v-if="product.lock" class="pc-lock">
      <span class="lock-icon">🔒</span>
      <span class="lock-text">{{ product.lock.reason }}</span>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  position: relative;
  background: #fff;
  border-radius: var(--r-lg);
  padding: 12px;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 0.12s ease;
  overflow: hidden;
}

.product-card:active {
  transform: scale(0.97);
}

.product-card.locked {
  opacity: 0.85;
}

.pc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}

.pc-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  flex-shrink: 0;
}

.pc-title {
  flex: 1;
  min-width: 0;
}

.pc-name {
  font-size: 12.5px;
  font-weight: 800;
}

.pc-cat {
  font-size: 9.5px;
  color: var(--text-sub);
}

.pc-risk {
  font-size: 15px;
  font-weight: 800;
}

.pc-attrs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 10px;
  margin-bottom: 8px;
}

.pc-attr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.pa-label {
  font-size: 9.5px;
  color: var(--text-sub);
  white-space: nowrap;
}

.pa-value {
  font-size: 9.5px;
  font-weight: 700;
  text-align: right;
}

.pc-skill {
  background: #f7f8fa;
  border-radius: 10px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ps-tag {
  font-size: 9.5px;
  font-weight: 800;
  color: var(--ios-indigo);
}

.ps-desc {
  font-size: 9px;
  color: var(--text-sub);
  line-height: 1.4;
}

.pc-lock {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.78);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: var(--r-lg);
}

.lock-icon {
  font-size: 20px;
}

.lock-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-sub);
  text-align: center;
  padding: 0 10px;
}
</style>
