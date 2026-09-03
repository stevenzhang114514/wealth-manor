<script setup>
/**
 * 夺金冒险 · 摸金开箱（核心玩法）
 * 板块建筑（经济作物/粮油/金属/油气）随机游走 × 容器投资方式（股票/债券/基金，双容器可切换）
 * 开箱 = 随机事件：五档品质掉落（更高品质更值钱概率更低）× 景气度 × 容器波动
 * 随机暴击 / 黑天鹅 + 双副收益（金币小奖、品质升级）
 * 达标撤离带出收益（100金币=1元）；四难度排位冲击段位；收益入庄园消费
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDifficulties, getAdventureContainers, getAdventureSectors } from '../api/adventure.js'
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
const containers = ref([])
const sectors = ref([])
const selectedContainers = ref([])
const pendingContainer = ref(null)
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
const containerInfo = (id) => containers.value.find((c) => c.id === id)

onMounted(async () => {
  const level = sim.riskLevel || 'R3'
  const [diffs, conts, sects] = await Promise.all([
    getDifficulties(),
    getAdventureContainers(level),
    getAdventureSectors(),
  ])
  difficulties.value = diffs
  containers.value = conts
  sectors.value = sects

  // 3分钟开场：首次进入自动开始新手局（截图可用 ?no_auto=1 停在选难度页）
  const noAuto = new URLSearchParams(location.search).get('no_auto') === '1'
  if (!noAuto && !localStorage.getItem('wm-adventure-started')) {
    localStorage.setItem('wm-adventure-started', '1')
    autoStartNewbie()
  }
})

const autoStartNewbie = async () => {
  toast('🎁 新手局开启：进板块、开箱子、攒够 1500 金币即可撤离', 'success')
  await begin('easy', ['bond'])
}

const toggleContainer = (c) => {
  if (c.lock) return
  const idx = selectedContainers.value.indexOf(c.id)
  if (idx >= 0) selectedContainers.value.splice(idx, 1)
  else if (selectedContainers.value.length < 2) selectedContainers.value.push(c.id)
  else toast('最多携带 2 个容器（投资方式）', 'error')
}

const begin = async (difficultyId, preset = null) => {
  starting.value = true
  try {
    const conts = preset ?? selectedContainers.value
    if (!conts.length) {
      toast('请至少选择 1 个容器（投资方式）', 'error')
      return
    }
    await adv.begin(difficultyId, conts, sim.riskLevel || 'R3')
    pendingContainer.value = run.value.containers[0] ?? null
    mode.value = 'running'
  } finally {
    starting.value = false
  }
}

/** 开箱 */
const dig = async () => {
  if (adv.loading || run.value.status !== 'playing') return
  await adv.step(pendingContainer.value ?? undefined)
  if (run.value.status === 'busted') mode.value = 'result'
}

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

const QUALITY_STYLE = (q) => ({ borderColor: q?.color, background: (q?.color || '#999') + '14' })
</script>

<template>
  <div class="adv-view">
    <!-- ============ 大厅 ============ -->
    <template v-if="mode === 'lobby'">
      <div class="adv-hero">
        <div class="ah-title">⛏️ 夺金冒险 · 摸金开箱</div>
        <div class="ah-sub">进板块 → 开容器 → 品质掉落：更高品质更值钱，但概率更低</div>
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

      <!-- 容器选择（投资方式） -->
      <div class="wm-card">
        <div class="card-title">📦 容器（投资方式）· 最多2个 · 开箱前可切换</div>
        <div class="container-grid">
          <div
            v-for="c in containers"
            :key="c.id"
            class="container-item"
            :class="{ picked: selectedContainers.includes(c.id), locked: !!c.lock }"
            @click="toggleContainer(c)"
          >
            <span class="c-emoji">{{ c.emoji }}</span>
            <span class="c-name">{{ c.name }}</span>
            <span class="c-attrs">
              波动×{{ c.volFactor }} · 暴击{{ c.critDelta >= 0 ? '+' : ''
              }}{{ Math.round(c.critDelta * 100) }}% · 副收益{{ Math.round(c.sideChance * 100) }}% ·
              升级{{ Math.round(c.upgradeChance * 100) }}%
            </span>
            <span v-if="c.lock" class="c-lock">🔒 {{ c.lock.reason }}</span>
          </div>
        </div>
        <div class="gear-hint">🔒 完成「装备解锁评估」可解锁更高风险容器（可选）</div>
        <button class="wm-btn ghost gear-risk-btn" @click="router.push('/risk')">
          🛡️ 装备解锁评估
        </button>
      </div>

      <!-- 板块图鉴 -->
      <div class="wm-card">
        <div class="card-title">🗺️ 板块图鉴（随机游走，掉落物一览）</div>
        <div v-for="s in sectors" :key="s.id" class="sector-row">
          <span class="s-icon">{{ s.icon }}</span>
          <div class="s-info">
            <div class="s-name" :style="{ color: s.color }">{{ s.name }}</div>
            <div class="s-desc">{{ s.desc }}</div>
          </div>
          <div class="s-items">
            <span
              v-for="it in s.items"
              :key="it.id"
              class="s-item"
              :title="`${it.name}（基础价值${it.baseValue}）`"
            >
              {{ it.emoji }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 摸金开箱中 ============ -->
    <template v-else-if="mode === 'running' && run">
      <!-- 顶部：金币与目标 -->
      <div class="run-head">
        <div class="rh-gold">{{ Math.round(run.gold) }}</div>
        <div class="rh-label">当前金币 / 目标 {{ run.targetGold }}</div>
        <div class="rh-progress">
          <div class="rh-fill" :style="{ width: goldPct + '%' }"></div>
        </div>
        <div class="rh-meta">
          <span class="wm-chip">{{ CYCLE_LABELS[run.econCycle] }}</span>
          <span class="wm-chip">第 {{ run.turn }}/{{ run.maxTurns }} 步</span>
          <span class="wm-chip">{{ run.difficultyName }}模式</span>
        </div>
      </div>

      <!-- 板块入口（随机游走） -->
      <div
        v-if="run.lastStep"
        class="sector-entry"
        :style="{ borderColor: run.lastStep.sector.color }"
      >
        <div class="se-head">
          <span class="se-icon">{{ run.lastStep.sector.icon }}</span>
          <span class="se-name">你走进了「{{ run.lastStep.sector.name }}」板块</span>
          <span class="se-mood">
            {{ run.lastStep.mood.icon }} {{ run.lastStep.mood.label }}
            <em :class="run.lastStep.mood.factor >= 0 ? 'up' : 'down'">
              {{ run.lastStep.mood.factor >= 0 ? '+' : '' }}{{ run.lastStep.mood.factor }}%
            </em>
          </span>
        </div>
        <div class="se-loot-preview">
          可能掉落：
          <span
            v-for="it in sectors.find((s) => s.id === run.lastStep.sector.id)?.items || []"
            :key="it.id"
            class="se-item"
          >
            {{ it.emoji }}{{ it.name }}
          </span>
        </div>
      </div>

      <!-- 容器切换条 -->
      <div class="container-bar">
        <span class="cb-label">📦 开箱容器：</span>
        <button
          v-for="cid in run.containers"
          :key="cid"
          class="cb-chip"
          :class="{ active: pendingContainer === cid }"
          @click="pendingContainer = cid"
        >
          {{ containerInfo(cid)?.emoji }} {{ containerInfo(cid)?.name }}
        </button>
      </div>

      <!-- 开箱结果（品质掉落） -->
      <div
        v-if="run.lastStep"
        :key="run.turn"
        class="loot-card"
        :style="QUALITY_STYLE(run.lastStep.quality)"
        :class="{ swan: run.lastStep.swan, crit: run.lastStep.crit }"
      >
        <div class="lc-head">
          <span class="lc-quality" :style="{ color: run.lastStep.quality.color }">
            {{ run.lastStep.quality.emoji }} {{ run.lastStep.quality.name }}
            <em v-if="run.lastStep.upgraded" class="lc-upgraded">⬆️ 品质升级!</em>
          </span>
          <span v-if="run.lastStep.crit" class="lc-badge crit-badge"
            >💥 暴击 ×{{ run.critRange[1] }}</span
          >
          <span v-if="run.lastStep.swan" class="lc-badge swan-badge">🦢 黑天鹅</span>
        </div>
        <div class="lc-loot">
          <span class="lc-emoji">{{ run.lastStep.loot.emoji }}</span>
          <span class="lc-name">{{ run.lastStep.loot.name }}</span>
          <span class="lc-value" :class="run.lastStep.value >= 0 ? 'up' : 'down'">
            {{ run.lastStep.value >= 0 ? '+' : '' }}{{ run.lastStep.value }} 金币
          </span>
        </div>
        <div v-if="run.lastStep.sideIncome" class="lc-side">
          🎁 副收益：摸到边角料 +{{ run.lastStep.sideIncome }} 金币
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="run-actions">
        <button
          class="wm-btn dig-btn"
          :disabled="adv.loading || run.status !== 'playing'"
          @click="dig"
        >
          ⛏️ 开箱
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
        ✅ 已达目标！可以撤离带出收益（继续开箱收益更高，风险也更高）
      </div>

      <!-- 掉落日志 -->
      <div class="log-box">
        <div
          v-for="(l, i) in run.log.slice(-5)"
          :key="i"
          class="log-line"
          :class="{ swan: l.swan, crit: l.crit }"
        >
          {{ l.text }}
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
          <span>{{ l.text }}</span>
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

/* 容器选择 */
.container-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.container-item {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.15s ease;
  text-align: center;
}

.container-item.picked {
  border-color: var(--ios-blue);
  background: #eef4ff;
}

.container-item.locked {
  opacity: 0.5;
}

.c-emoji {
  font-size: 22px;
}

.c-name {
  font-size: 11.5px;
  font-weight: 800;
}

.c-attrs {
  font-size: 8.5px;
  color: var(--text-sub);
  line-height: 1.5;
}

.c-lock {
  font-size: 8px;
  color: var(--text-sub);
}

.gear-hint {
  font-size: 10px;
  color: var(--text-sub);
  margin-bottom: 8px;
}

.gear-risk-btn {
  width: 100%;
}

/* 板块图鉴 */
.sector-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 0.5px solid var(--separator);
}

.sector-row:last-child {
  border-bottom: none;
}

.s-icon {
  font-size: 22px;
}

.s-info {
  flex: 1;
  min-width: 0;
}

.s-name {
  font-size: 12px;
  font-weight: 800;
}

.s-desc {
  font-size: 9.5px;
  color: var(--text-sub);
}

.s-items {
  display: flex;
  gap: 4px;
}

.s-item {
  font-size: 16px;
}

/* 摸金开箱中 */
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

/* 板块入口 */
.sector-entry {
  border: 1.5px solid;
  border-radius: var(--r-lg);
  background: #fff;
  padding: 12px;
  margin: 10px 12px 0;
  box-shadow: var(--shadow-card);
  animation: ebIn 0.35s ease both;
}

.se-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
}

.se-icon {
  font-size: 20px;
}

.se-name {
  font-size: 13px;
  font-weight: 800;
  flex: 1;
}

.se-mood {
  font-size: 11px;
  font-weight: 700;
}

.se-mood em {
  font-style: normal;
  margin-left: 3px;
}

.se-loot-preview {
  font-size: 10px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.se-item {
  background: #f4f6f8;
  border-radius: 999px;
  padding: 2px 8px;
}

/* 容器切换条 */
.container-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 10px 12px 0;
}

.cb-label {
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.cb-chip {
  flex: 1;
  border: 1.5px solid #e0e4e8;
  background: #fff;
  border-radius: 999px;
  padding: 7px 0;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-main);
}

.cb-chip.active {
  border-color: var(--ios-blue);
  background: #eef4ff;
  color: var(--ios-blue);
}

/* 开箱结果卡 */
.loot-card {
  border: 2px solid;
  border-radius: var(--r-lg);
  padding: 13px;
  margin: 10px 12px 0;
  animation: ebIn 0.4s ease both;
}

.loot-card.crit {
  animation: pulse 0.6s ease;
}

.loot-card.swan {
  animation: shake 0.5s ease;
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

.lc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.lc-quality {
  font-size: 13px;
  font-weight: 800;
}

.lc-upgraded {
  font-style: normal;
  font-size: 10px;
  color: var(--ios-indigo);
}

.lc-badge {
  font-size: 10px;
  font-weight: 800;
}

.crit-badge {
  color: #e65100;
}

.swan-badge {
  color: #c62828;
}

.lc-loot {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lc-emoji {
  font-size: 30px;
}

.lc-name {
  font-size: 15px;
  font-weight: 800;
  flex: 1;
}

.lc-value {
  font-size: 18px;
  font-weight: 800;
}

.lc-side {
  margin-top: 8px;
  font-size: 10.5px;
  color: #8a6d1f;
  background: #fff6dd;
  border-radius: 8px;
  padding: 5px 9px;
}

/* 操作 */
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
