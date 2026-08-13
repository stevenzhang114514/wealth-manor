<script setup>
/**
 * 植物详情底部弹层：生长进度 + 关联理财产品 + 收益映射
 * Teleport 到 body，固定于手机框底部居中
 */
import { toast } from '../../utils/toast.js'

defineProps({
  plant: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const showDetail = (p) => {
  toast(`「${p.linkedProduct.name}」持仓详情（演示版未接入交易系统）`)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="plant" class="sheet-backdrop" @click.self="emit('close')">
      <div class="plant-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-head">
          <div class="sheet-emoji" :style="{ background: plant.speciesColor + '22' }">
            {{ plant.emoji }}
          </div>
          <div class="sheet-title">
            <div class="sheet-name">
              {{ plant.speciesName }}
              <span class="wm-chip" :class="plant.stage === 'wilted' ? 'warn' : 'ok'">
                {{ plant.stageLabel }}
              </span>
            </div>
            <div class="sheet-sub">{{ plant.plot }} · {{ plant.volatility }}波动 · {{ plant.matureDays }}天周期</div>
          </div>
          <button class="sheet-close" @click="emit('close')">✕</button>
        </div>

        <!-- 生长进度 -->
        <div class="sheet-progress">
          <div class="progress-row">
            <span>生长进度</span>
            <span>{{ Math.round(plant.progress * 100) }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: plant.progress * 100 + '%', background: plant.speciesColor }"></div>
          </div>
          <div v-if="plant.stage === 'mature'" class="progress-tip">🌾 已成熟，可收获！产品到期赎回即触发丰收奖励</div>
          <div v-else-if="plant.stage === 'wilted'" class="progress-tip warn-text">🥀 提前赎回导致枯萎——坚持持有，静待花开</div>
          <div v-else class="progress-tip">预计 {{ plant.matureAt }} 成熟 · 到期赎回享丰收奖励</div>
        </div>

        <!-- 关联产品 -->
        <div class="product-card">
          <div class="product-row">
            <span class="p-name">💳 {{ plant.linkedProduct.name }}</span>
            <span class="wm-chip">{{ plant.linkedProduct.category }}</span>
          </div>
          <div class="product-meta">
            <span>代码 {{ plant.linkedProduct.code }}</span>
            <span>持有收益率 <b :class="plant.linkedProduct.yieldRate >= 0 ? 'up' : 'down'">+{{ plant.linkedProduct.yieldRate }}%</b></span>
          </div>
          <button class="wm-btn ghost wm-btn-block" @click="showDetail(plant)">查看持仓详情</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 24, 0.45);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.plant-sheet {
  width: min(375px, 100vw);
  background: #fff;
  border-radius: 22px 22px 0 0;
  padding: 10px 18px 22px;
  animation: slideUp 0.26s ease both;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: #e3e6ea;
  border-radius: 999px;
  margin: 0 auto 12px;
}

.sheet-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sheet-emoji {
  font-size: 30px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  flex-shrink: 0;
}

.sheet-name {
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sheet-sub {
  font-size: 11px;
  color: var(--text-sub);
  margin-top: 3px;
}

.sheet-close {
  margin-left: auto;
  border: none;
  background: #f2f3f5;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 12px;
}

.sheet-progress {
  margin-bottom: 14px;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-sub);
  margin-bottom: 5px;
}

.progress-track {
  height: 8px;
  background: #eef0f2;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.progress-tip {
  font-size: 11px;
  color: var(--manor-green);
  margin-top: 6px;
}

.progress-tip.warn-text {
  color: var(--text-sub);
}

.product-card {
  background: #f8f9fb;
  border-radius: 14px;
  padding: 12px;
}

.product-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.p-name {
  font-size: 13px;
  font-weight: 700;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-sub);
  margin-bottom: 10px;
}

.wm-btn-block {
  width: 100%;
  font-size: 12px;
  padding: 9px;
}
</style>
