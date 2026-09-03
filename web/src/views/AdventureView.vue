<script setup>
/**
 * 夺金冒险（摸金撤离）——核心玩法
 * 状态机：lobby 选难度/装备 → running 摸金（随机事件+暴击+黑天鹅）→ result 撤离结算/血本无归
 * 收益=游戏金币（100金币=1元现实收入）；达标可撤离，成功加排位分（段位青铜~王者）
 * 3分钟开场：首次进入自动开局简单模式新手局（前3回合无黑天鹅）
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDifficulties, getAdventureGear } from '../api/adventure.js'
import { useAdventureStore } from '../stores/adventure.js'
import { useSimulatorStore } from '../stores/simulator.js'
import { useManorStore } from '../stores/manor.js'

import { toast, flyCoin } from '../utils/toast.js'

const router = useRouter()
const adv = useAdventureStore()
const sim = useSimulatorStore()
const manor = useManorStore()

const mode = ref('lobby')
const difficulties = ref([])
const gearList = ref([])
const selectedGear = ref([])
const starting = ref(false)

const CYCLE_LABELS = {
  expansion: '扩张期',
  overheating: '过热期',
  recession: '衰退期',
  recovery: '复苏期',
}

const run = computed(() => adv.run)
const goldPct = computed(() => {
  const r = run.value
  if (!r) return 0
  return Math.min(100, Math.round((r.gold / r.targetGold) * 100))
})
const canExtract = computed(() => run.value && run.value.gold >= run.value.targetGold)

onMounted(async () => {
  difficulties.value = await getDifficulties()
  const level = sim.riskLevel || 'R3'
  gearList.value = await getAdventureGear(level)

  // 3分钟开场：首次进入自动开始新手局（简单模式，平稳开局）；截图可用 ?no_auto=1 停在选难度页
  const noAuto = new URLSearchParams(location.search).get('no_auto') === '1'
  if (!noAuto && !localStorage.getItem('wm-adventure-started')) {
    localStorage.setItem('wm-adventure-started', '1')
    autoStartNewbie()
  }
})

/** 新手局：默认装备稳健产品，直接进入摸金 */
const autoStartNewbie = async () => {
  toast('🎁 新手局开启：攒够 1500 金币即可撤离', 'success')
  await begin('easy', ['p_mmf', 'p_shortbond'])
}

const toggleGear = (p) => {
  if (p.lock) return
  const idx = selectedGear.value.indexOf(p.id)
  if (idx >= 0) selectedGear.value.splice(idx, 1)
  else if (selectedGear.value.length < 4) selectedGear.value.push(p.id)
  else toast('最多装备 4 张产品卡', 'error')
}

const begin = async (difficultyId, presetGear = null) => {
  starting.value = true
  try {
    const gear = presetGear ?? selectedGear.value
    if (!gear.length) {
      toast('请至少选择 1 张产品卡作为摸金装备', 'error')
      return
    }
    await adv.begin(difficultyId, gear, sim.riskLevel || 'R3')
    mode.value = 'running'
  } finally {
    starting.value = false
  }
}

/** 继续摸金 */
const keepDigging = async () => {
  if (adv.loading || run.value.status !== 'playing') return
  await adv.step()
  if (run.value.status === 'busted') mode.value = 'result'
}

/** 撤离 */
const extract = async () => {
  if (!canExtract.value || adv.loading) return
  const res = await adv.extract()
  manor.setState(res.manor)
  flyCoin(`+${res.run.result.profit} 🪙`)
  toast(
    `🚪 撤离成功！带出 ${res.run.result.profit} 金币 ≈ 现实收入 ¥${res.run.result.realIncomeYuan}`,
    'success',
  )
  mode.value = 'result'
}

const again = () => {
  adv.setRun(null)
  mode.value = 'lobby'
}

const goManor = () => router.push('/manor')
</script>

<template>
  <div class="adv-view">
    <!-- ============ 大厅 ============ -->
    <template v-if="mode === 'lobby'">
      <div class="adv-hero">
        <div class="ah-title">⛏️ 夺金冒险</div>
        <div class="ah-sub">运气 × 策略：摸金攒钱，达标撤离，带出收益</div>
        <div class="ah-rank">
          <span class="wm-chip">🏆 排位分 {{ adv.rankScore }}</span>
          <span class="wm-chip">100金币 = 1元现实收入</span>
        </div>
      </div>

      <!-- 难度卡 -->
      <div v-for="d in difficulties" :key="d.id" class="diff-card" :class="d.id">
        <div class="dc-head">
          <span class="dc-icon">{{ d.icon }}</span>
          <div class="dc-info">
            <div class="dc-name">{{ d.name }}模式</div>
            <div class="dc-desc">{{ d.desc }}</div>
          </div>
        </div>
        <div class="dc-metrics">
          <span>🎯 目标 {{ d.startGold * d.targetMultiple }} 金币</span>
          <span>🦢 黑天鹅 {{ Math.round(d.blackSwanPct * 100) }}%</span>
          <span>💥 暴击 ×{{ d.critRange[1] }}</span>
          <span>🏆 排位×{{ d.rankFactor }}</span>
        </div>
        <button class="wm-btn dc-btn" :disabled="starting" @click="begin(d.id)">⛏️ 出发摸金</button>
      </div>

      <!-- 装备选择 -->
      <div class="wm-card">
        <div class="card-title">🎒 摸金装备（最多4张 · 风评解锁）</div>
        <div class="gear-grid">
          <div
            v-for="p in gearList"
            :key="p.id"
            class="gear-item"
            :class="{ picked: selectedGear.includes(p.id), locked: !!p.lock }"
            @click="toggleGear(p)"
          >
            <span class="g-emoji">{{ p.emoji }}</span>
            <span class="g-name">{{ p.name }}</span>
            <span class="g-risk" :style="{ color: p.lock ? '#999' : '#007aff' }">{{
              p.riskLevel
            }}</span>
          </div>
        </div>
        <div class="gear-hint">🔒 完成「装备解锁评估」可解锁更高风险产品卡（可选）</div>
        <button class="wm-btn ghost gear-risk-btn" @click="router.push('/risk')">
          🛡️ 装备解锁评估
        </button>
      </div>
    </template>

    <!-- ============ 摸金中 ============ -->
    <template v-else-if="mode === 'running' && run">
      <!-- 顶部：金币与目标 -->
      <div class="run-head">
        <div class="rh-gold">{{ Math.round(run.gold) }}</div>
        <div class="rh-label">当前金币 / 目标 {{ run.targetGold }}</div>
        <div class="rh-progress">
          <div class="rh-fill" :style="{ width: goldPct + '%' }"></div>
          <span class="rh-mark" :style="{ left: '100%' }"></span>
        </div>
        <div class="rh-meta">
          <span class="wm-chip">{{ CYCLE_LABELS[run.econCycle] }}</span>
          <span class="wm-chip">第 {{ run.turn }}/{{ run.maxTurns }} 步</span>
          <span class="wm-chip">{{ run.difficultyName }}模式</span>
        </div>
      </div>

      <!-- 事件卡 -->
      <div
        v-if="run.lastStep"
        :key="run.turn"
        class="event-banner"
        :class="{ swan: run.lastStep.swan, crit: run.lastStep.crit }"
      >
        <div class="eb-icon">{{ run.lastStep.event.icon }}</div>
        <div class="eb-body">
          <div class="eb-title">
            {{ run.lastStep.event.title }}
            <span v-if="run.lastStep.crit" class="eb-badge crit-badge">💥 暴击!</span>
            <span v-if="run.lastStep.swan" class="eb-badge swan-badge">🦢 黑天鹅!</span>
          </div>
          <div class="eb-desc">{{ run.lastStep.event.desc }}</div>
        </div>
      </div>

      <!-- 收益滚动 -->
      <div v-if="run.lastStep?.gains?.length" class="wm-card">
        <div class="card-title">📈 本步收益</div>
        <div v-for="g in run.lastStep.gains" :key="g.productId" class="gain-row">
          <span>{{ g.emoji }} {{ g.name }}</span>
          <span :class="g.gain >= 0 ? 'up' : 'down'">
            {{ g.rate >= 0 ? '+' : '' }}{{ g.rate }}% · {{ g.gain >= 0 ? '+' : ''
            }}{{ g.gain }} 金币
          </span>
        </div>
      </div>

      <!-- 装备列表 -->
      <div class="wm-card">
        <div class="card-title">🎒 摸金装备</div>
        <div class="run-gear">
          <span v-for="pid in run.gear" :key="pid" class="rg-chip">
            {{ gearList.find((p) => p.id === pid)?.emoji }}
            {{ gearList.find((p) => p.id === pid)?.name }}
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="run-actions">
        <button
          class="wm-btn dig-btn"
          :disabled="adv.loading || run.status !== 'playing'"
          @click="keepDigging"
        >
          ⛏️ 继续摸金
        </button>
        <button
          class="wm-btn out-btn"
          :disabled="!canExtract || adv.loading"
          :class="{ ready: canExtract }"
          @click="extract"
        >
          🚪 撤离
        </button>
      </div>
      <div v-if="!canExtract" class="run-tip">
        ⚠️ 再摸
        {{ Math.max(0, run.targetGold - Math.round(run.gold)) }} 金币即可撤离——贪心还是落袋为安？
      </div>
      <div v-else class="run-tip ready-tip">
        ✅ 已达目标！可以撤离带出收益（继续摸金收益更高，风险也更高）
      </div>

      <!-- 事件日志 -->
      <div class="log-box">
        <div
          v-for="(l, i) in run.log.slice(-4)"
          :key="i"
          class="log-line"
          :class="{ swan: l.swan, crit: l.crit }"
        >
          {{ l.icon }} {{ l.title }} · {{ Math.round(l.gold) }} 金币
        </div>
      </div>
    </template>

    <!-- ============ 结算 ============ -->
    <template v-else-if="mode === 'result' && run">
      <div class="result-hero" :class="{ busted: run.status === 'busted' }">
        <div class="re-title">
          {{
            run.status === 'extracted'
              ? '🎉 撤离成功'
              : run.status === 'busted'
                ? '💀 血本无归'
                : ''
          }}
        </div>
        <template v-if="run.status === 'extracted'">
          <div class="re-gold">+{{ run.result.profit }} 🪙</div>
          <div class="re-line">折算现实收入 ¥{{ run.result.realIncomeYuan }}（100金币=1元）</div>
          <div class="re-line">排位分 +{{ run.result.rankScore }}</div>
          <div class="re-line">
            触发暴击 {{ run.result.critCount }} 次 · 遭遇黑天鹅 {{ run.result.swanCount }} 次
          </div>
          <div class="re-line">金币已入庄园，可购买装饰与家具</div>
        </template>
        <template v-else>
          <div class="re-line">冒险失败，本局收益归零——运气之外，纪律同样重要</div>
        </template>
      </div>

      <div class="wm-card">
        <div class="card-title">📜 本局回顾</div>
        <div
          v-for="(l, i) in run.log"
          :key="i"
          class="review-line"
          :class="{ swan: l.swan, crit: l.crit }"
        >
          <span>{{ l.icon }} {{ l.title }}</span>
          <span>{{ Math.round(l.gold) }} 金币</span>
        </div>
      </div>

      <div class="run-actions">
        <button class="wm-btn dig-btn" @click="again">🔁 再来一局</button>
        <button class="wm-btn ghost out-btn" @click="goManor">🏡 回庄园消费</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.adv-view {
  padding-bottom: 90px;
}

/* 大厅 */
.adv-hero {
  background: linear-gradient(135deg, #5b3a1e, #8a5a2b 60%, #c98f4e);
  color: #fff;
  padding: 22px 18px 24px;
  border-radius: 0 0 var(--r-xl) var(--r-xl);
}

.ah-title {
  font-size: 20px;
  font-weight: 800;
}

.ah-sub {
  font-size: 11px;
  opacity: 0.92;
  margin-top: 4px;
}

.ah-rank {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.diff-card {
  background: #fff;
  border-radius: var(--r-lg);
  padding: 14px;
  margin: 10px 12px;
  box-shadow: var(--shadow-card);
  border-left: 4px solid #8a8f99;
}

.diff-card.easy {
  border-left-color: #34c759;
}

.diff-card.normal {
  border-left-color: #5ac8fa;
}

.diff-card.hard {
  border-left-color: #ff9500;
}

.diff-card.nightmare {
  border-left-color: #af52de;
}

.dc-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.dc-icon {
  font-size: 26px;
}

.dc-name {
  font-size: 14px;
  font-weight: 800;
}

.dc-desc {
  font-size: 10.5px;
  color: var(--text-sub);
  margin-top: 2px;
  line-height: 1.5;
}

.dc-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 10.5px;
  color: var(--text-sub);
  margin-bottom: 10px;
}

.dc-btn {
  width: 100%;
  padding: 11px;
}

/* 装备 */
.gear-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.gear-item {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 10px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.15s ease;
}

.gear-item.picked {
  border-color: var(--ios-blue);
  background: #eef4ff;
}

.gear-item.locked {
  opacity: 0.5;
}

.g-emoji {
  font-size: 20px;
}

.g-name {
  font-size: 9px;
  font-weight: 700;
  text-align: center;
}

.g-risk {
  font-size: 10px;
  font-weight: 800;
}

.gear-hint {
  font-size: 10px;
  color: var(--text-sub);
  margin-bottom: 8px;
}

.gear-risk-btn {
  width: 100%;
}

/* 摸金中 */
.run-head {
  background: linear-gradient(180deg, #2c2c33, #1c1c21);
  color: #fff;
  padding: 18px 16px 16px;
  border-radius: 0 0 var(--r-xl) var(--r-xl);
  text-align: center;
}

.rh-gold {
  font-size: 38px;
  font-weight: 800;
  color: #ffd54f;
}

.rh-label {
  font-size: 11px;
  opacity: 0.85;
  margin: 2px 0 10px;
}

.rh-progress {
  position: relative;
  height: 10px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.rh-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd54f, #ff9500);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.rh-meta {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.event-banner {
  display: flex;
  gap: 10px;
  background: linear-gradient(135deg, #fff6dd, #ffe9b0);
  border: 1px solid #f2dc9a;
  border-radius: var(--r-lg);
  padding: 13px;
  margin: 10px 12px 0;
  animation: ebIn 0.4s ease both;
}

.event-banner.swan {
  background: linear-gradient(135deg, #ffebec, #ffd9db);
  border-color: #f5b5b8;
  animation: shake 0.5s ease;
}

.event-banner.crit {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-color: #ffb74d;
  animation: pulse 0.6s ease;
}

@keyframes ebIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}

.eb-icon {
  font-size: 24px;
}

.eb-title {
  font-size: 13px;
  font-weight: 800;
}

.eb-badge {
  font-size: 10px;
  font-weight: 800;
  margin-left: 6px;
}

.crit-badge {
  color: #e65100;
}

.swan-badge {
  color: #c62828;
}

.eb-desc {
  font-size: 10.5px;
  color: #6d5b3a;
  margin-top: 3px;
  line-height: 1.5;
}

.gain-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 5px;
}

.run-gear {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rg-chip {
  font-size: 10px;
  font-weight: 700;
  background: #f2f3f5;
  padding: 4px 10px;
  border-radius: 999px;
}

.run-actions {
  display: flex;
  gap: 10px;
  margin: 12px 12px 0;
}

.dig-btn {
  flex: 1;
  padding: 13px;
  font-size: 14px;
  background: linear-gradient(135deg, #ff9500, #e68a00);
}

.out-btn {
  flex: 1;
  padding: 13px;
  font-size: 14px;
  background: #8a8f99;
}

.out-btn.ready {
  background: var(--ios-green);
}

.run-tip {
  text-align: center;
  font-size: 10.5px;
  color: var(--text-sub);
  margin: 8px 12px 0;
}

.run-tip.ready-tip {
  color: #248a3d;
  font-weight: 700;
}

.log-box {
  margin: 10px 14px 0;
}

.log-line {
  font-size: 9.5px;
  color: var(--text-sub);
  line-height: 1.7;
}

.log-line.crit {
  color: #e65100;
  font-weight: 700;
}

.log-line.swan {
  color: #c62828;
  font-weight: 700;
}

/* 结算 */
.result-hero {
  background: linear-gradient(135deg, #ffb300, #ff9500);
  color: #fff;
  padding: 26px 18px 30px;
  border-radius: 0 0 var(--r-xl) var(--r-xl);
  text-align: center;
}

.result-hero.busted {
  background: linear-gradient(135deg, #455a64, #263238);
}

.re-title {
  font-size: 20px;
  font-weight: 800;
}

.re-gold {
  font-size: 30px;
  font-weight: 800;
  margin: 8px 0 4px;
}

.re-line {
  font-size: 11px;
  opacity: 0.92;
  margin-top: 4px;
  line-height: 1.6;
}

.review-line {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  margin-bottom: 5px;
}

.review-line.crit {
  color: #e65100;
  font-weight: 700;
}

.review-line.swan {
  color: #c62828;
  font-weight: 700;
}
</style>
