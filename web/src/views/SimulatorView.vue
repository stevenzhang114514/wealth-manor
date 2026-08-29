<script setup>
/**
 * 财富人生模拟器（回合制核心玩法，1回合=1个月）
 * 状态机：pick 选剧本 → playing 回合经营 → over 复盘护照
 * 金融产品=英雄卡：七维属性 + 风评门槛 + 起投门槛；经历经济周期与政策事件，达成现金流目标
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSimProducts, getScenarios } from '../api/simulator.js'
import { useSimulatorStore } from '../stores/simulator.js'
import { formatMoney } from '../utils/format.js'
import { toast } from '../utils/toast.js'
import ProductCard from '../components/ProductCard.vue'
import EventCard from '../components/EventCard.vue'

const router = useRouter()
const sim = useSimulatorStore()

const mode = ref('pick')
const scenarios = ref([])
const products = ref([])
const pendingBuys = ref([]) // [{productId, amount}]
const pendingRedeems = ref([]) // [{index, amount}]
const buyTarget = ref(null) // 购买弹层选中的产品
const buyAmount = ref(0)
const advancing = ref(false)

const CYCLE_LABELS = {
  expansion: '扩张期',
  overheating: '过热期',
  recession: '衰退期',
  recovery: '复苏期',
}
const POLICY_LABELS = {
  none: '常态政策',
  easing: '宽松利率',
  tightening: '紧缩利率',
  stamp_cut: '印花税下调',
  tax_benefit: '养老金税优',
  lpr_cut: 'LPR下调',
}

const session = computed(() => sim.session)
const surplus = computed(() => (session.value ? session.value.income - session.value.expense : 0))

/** 流动性口径：现金 + T+0/T+1 持仓 + 已到期锁定持仓 */
const liquid = computed(() => {
  const s = session.value
  if (!s) return 0
  let sum = s.cash
  for (const h of s.holdings) {
    const p = products.value.find((x) => x.id === h.productId)
    if (!p) continue
    const matured = p.termMonths ? s.turn - h.purchaseTurn >= p.termMonths : false
    if (p.liquidity?.type !== 'locked' || matured) sum += h.amount
  }
  return Math.round(sum)
})

const netWorth = computed(() => {
  const s = session.value
  if (!s) return 0
  const hv = s.holdings.reduce((sum, h) => sum + h.amount, 0)
  return Math.round(s.cash + hv - (s.debt?.balance ?? 0))
})

onMounted(async () => {
  // 截图/演示可用 ?demo_risk=R3 预设风评等级
  const demoRisk = new URLSearchParams(location.search).get('demo_risk')
  if (demoRisk) sim.setRiskLevel(demoRisk)
  scenarios.value = await getScenarios()
})

const loadProducts = async () => {
  products.value = await getSimProducts(sim.riskLevel, session.value?.cash ?? 0)
}

/** 开始剧本 */
const begin = async (sc) => {
  if (!sim.hasRiskLevel) {
    toast('请先完成风险评估', 'error')
    router.push('/risk')
    return
  }
  await sim.begin(sc.id)
  await loadProducts()
  mode.value = 'playing'
}

/** 打开购买弹层 */
const openBuy = (p) => {
  if (p.lock) return
  buyTarget.value = p
  buyAmount.value = Math.min(surplus.value > 0 ? Math.floor(surplus.value) : 0, session.value.cash)
}

const confirmBuy = () => {
  const amount = Math.round(Number(buyAmount.value) || 0)
  if (amount <= 0) {
    toast('请输入有效金额', 'error')
    return
  }
  if (amount > session.value.cash) {
    toast('现金不足', 'error')
    return
  }
  const exist = pendingBuys.value.find((b) => b.productId === buyTarget.value.id)
  if (exist) exist.amount += amount
  else pendingBuys.value.push({ productId: buyTarget.value.id, amount })
  toast(`已加入待执行：买入 ${buyTarget.value.name} ${formatMoney(amount)}`)
  buyTarget.value = null
}

/** 加入赎回 */
const addRedeem = (index) => {
  const h = session.value.holdings[index]
  if (!h) return
  const p = products.value.find((x) => x.id === h.productId)
  const matured = p?.termMonths ? session.value.turn - h.purchaseTurn >= p.termMonths : true
  if (!matured && p?.earlyRedeem?.type === 'forbidden') {
    toast('封闭期内不可赎回', 'error')
    return
  }
  pendingRedeems.value.push({ index, amount: h.amount })
  toast(`已加入待执行：赎回 ${p?.name ?? ''}`)
}

const clearPending = () => {
  pendingBuys.value = []
  pendingRedeems.value = []
}

/** 结束本月：提交决策推进一回合 */
const endMonth = async () => {
  if (advancing.value) return
  advancing.value = true
  try {
    await sim.advance({ buys: pendingBuys.value, redeems: pendingRedeems.value })
    clearPending()
    await loadProducts()
    if (session.value.gameOver) mode.value = 'over'
  } finally {
    advancing.value = false
  }
}

const restart = () => {
  sim.setSession(null)
  pendingBuys.value = []
  pendingRedeems.value = []
  mode.value = 'pick'
}

const goalStatus = (g) => (g.done ? 'done' : g.missed ? 'missed' : 'ongoing')

const overTitle = computed(() => {
  if (!session.value) return ''
  if (session.value.gameOver === 'liquidity') return '💸 流动性危机'
  return '🏁 经营期满'
})
</script>

<template>
  <div class="sim-view">
    <!-- ============ 选择剧本 ============ -->
    <template v-if="mode === 'pick'">
      <div class="sim-hero">
        <div class="sh-title">🧭 财富人生模拟器</div>
        <div class="sh-sub">每回合=1个月 · 产品即英雄 · 风评定阵容 · 目标定输赢</div>
      </div>

      <!-- 风评引导 -->
      <div v-if="!sim.hasRiskLevel" class="wm-card risk-hint">
        <div class="card-title">🛡️ 先完成风险评估</div>
        <div class="rh-text">风评等级决定你的初始可购产品阵容（就像游戏里的英雄池）</div>
        <button class="wm-btn wm-btn-block" @click="router.push('/risk')">开始风险评估 →</button>
      </div>
      <div v-else class="risk-ok">
        🛡️ 当前风评：<b>{{ sim.riskLevel }}</b> · 可重新评估
      </div>

      <!-- 剧本卡 -->
      <div v-for="sc in scenarios" :key="sc.id" class="scenario-card">
        <div class="sc-head">
          <span class="sc-icon">{{ sc.icon }}</span>
          <div class="sc-info">
            <div class="sc-name">{{ sc.name }}</div>
            <div class="sc-desc">{{ sc.desc }}</div>
          </div>
        </div>
        <div class="sc-metrics">
          <span>💰 月入 {{ formatMoney(sc.monthlyIncome) }}</span>
          <span>🛒 月支 {{ formatMoney(sc.monthlyExpense) }}</span>
          <span>🏦 初始 {{ formatMoney(sc.cash) }}</span>
        </div>
        <div v-if="sc.debt" class="sc-debt">
          🏠 房贷 {{ formatMoney(sc.debt.balance) }} · 月供 {{ formatMoney(sc.debt.monthly) }}
        </div>
        <div class="sc-goals">
          <div v-for="g in sc.goals" :key="g.id" class="sc-goal">
            🎯 {{ g.label }}：{{ formatMoney(g.targetAmount) }}（{{ g.turn }}回合内）
          </div>
        </div>
        <button class="wm-btn wm-btn-block" :disabled="!sim.hasRiskLevel" @click="begin(sc)">
          🚀 开始经营（{{ sc.totalTurns }} 回合）
        </button>
      </div>
    </template>

    <!-- ============ 回合经营 ============ -->
    <template v-else-if="mode === 'playing' && session">
      <!-- 顶栏 -->
      <div class="play-top">
        <div class="pt-left">
          <span class="pt-scenario">{{
            session.scenarioId === 'college'
              ? '🎓 校园青年'
              : session.scenarioId === 'career'
                ? '💼 职场新人'
                : '👨‍👩‍👧 青年家庭'
          }}</span>
          <span class="pt-turn"
            >第 {{ session.turn }}/{{ session.totalTurns }} 月 · {{ session.age }}岁</span
          >
        </div>
        <div class="pt-econ">
          <span class="wm-chip">{{ CYCLE_LABELS[session.econState.cycle] }}</span>
          <span class="wm-chip">{{ POLICY_LABELS[session.econState.policy] }}</span>
        </div>
      </div>

      <!-- 家庭面板 -->
      <div class="wm-card family-panel">
        <div class="fp-row">
          <div class="fp-item">
            <div class="fp-num up">{{ formatMoney(session.cash) }}</div>
            <div class="fp-label">现金</div>
          </div>
          <div class="fp-item">
            <div class="fp-num" :class="surplus >= 0 ? 'up' : 'down'">
              {{ surplus >= 0 ? '+' : '' }}{{ formatMoney(surplus) }}
            </div>
            <div class="fp-label">月结余</div>
          </div>
          <div class="fp-item">
            <div class="fp-num">{{ formatMoney(netWorth) }}</div>
            <div class="fp-label">净资产</div>
          </div>
          <div v-if="session.debt" class="fp-item">
            <div class="fp-num down">-{{ formatMoney(session.debt.monthly) }}</div>
            <div class="fp-label">房贷月供</div>
          </div>
        </div>
      </div>

      <!-- 本回合事件 -->
      <EventCard :event="session.lastEvent" />

      <!-- 结算结果 -->
      <div v-if="session.lastSettlement?.length" class="wm-card">
        <div class="card-title">📈 本月结算</div>
        <div v-for="s in session.lastSettlement" :key="s.productId" class="settle-row">
          <span>{{ s.emoji }} {{ s.name }}</span>
          <span :class="s.gain >= 0 ? 'up' : 'down'">
            {{ s.rate >= 0 ? '+' : '' }}{{ s.rate }}% / {{ s.gain >= 0 ? '+' : ''
            }}{{ formatMoney(s.gain) }}
          </span>
        </div>
      </div>

      <!-- 目标进度 -->
      <div class="wm-card">
        <div class="card-title">🎯 现金流目标</div>
        <div v-for="g in session.goals" :key="g.id" class="goal-row">
          <div class="g-head">
            <span class="g-name">{{ g.label }}</span>
            <span
              class="wm-chip"
              :class="goalStatus(g) === 'done' ? 'ok' : goalStatus(g) === 'missed' ? 'warn' : ''"
            >
              {{
                goalStatus(g) === 'done'
                  ? '✓ 已达成'
                  : goalStatus(g) === 'missed'
                    ? '✗ 未达成'
                    : `${g.turn - session.turn} 回合后`
              }}
            </span>
          </div>
          <div class="g-progress">
            <div
              class="g-fill"
              :style="{ width: Math.min(100, (liquid / g.targetAmount) * 100) + '%' }"
            ></div>
          </div>
          <div class="g-nums">
            <span>可用 {{ formatMoney(liquid) }}</span>
            <span>目标 {{ formatMoney(g.targetAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- 持仓 -->
      <div v-if="session.holdings.length" class="wm-card">
        <div class="card-title">📦 我的持仓（{{ session.holdings.length }}）</div>
        <div v-for="(h, i) in session.holdings" :key="i" class="hold-row">
          <span class="h-emoji">{{ products.find((p) => p.id === h.productId)?.emoji }}</span>
          <div class="h-info">
            <div class="h-name">{{ products.find((p) => p.id === h.productId)?.name }}</div>
            <div class="h-sub">
              持有 {{ session.turn - h.purchaseTurn }} 月 · 上期 {{ h.lastReturn >= 0 ? '+' : ''
              }}{{ h.lastReturn }}%
            </div>
          </div>
          <span class="h-amount">{{ formatMoney(Math.round(h.amount)) }}</span>
          <button class="wm-btn ghost h-redeem" @click="addRedeem(i)">赎回</button>
        </div>
      </div>

      <!-- 产品英雄卡池 -->
      <div class="wm-card">
        <div class="card-title">🃏 产品英雄池 · 本月结余 {{ formatMoney(surplus) }} 可配置</div>
        <div class="product-grid">
          <ProductCard v-for="p in products" :key="p.id" :product="p" @select="openBuy" />
        </div>
      </div>

      <!-- 待执行决策条 -->
      <div v-if="pendingBuys.length || pendingRedeems.length" class="pending-bar">
        <div class="pending-list">
          <span v-for="(b, i) in pendingBuys" :key="'b' + i" class="pending-chip">
            🛒 {{ products.find((p) => p.id === b.productId)?.name }} {{ formatMoney(b.amount) }}
          </span>
          <span v-for="(r, i) in pendingRedeems" :key="'r' + i" class="pending-chip redeem">
            💸 赎回 {{ products.find((p) => p.id === session.holdings[r.index]?.productId)?.name }}
          </span>
        </div>
        <button class="pending-clear" @click="clearPending">清空</button>
      </div>

      <!-- 底部操作 -->
      <div class="end-bar">
        <button class="wm-btn end-btn" :disabled="advancing" @click="endMonth">
          {{ advancing ? '结算中…' : '📆 结束本月' }}
        </button>
      </div>

      <!-- 最近日志 -->
      <div class="log-box">
        <div v-for="(l, i) in session.log.slice(-4)" :key="i" class="log-line" :class="l.type">
          {{ l.text }}
        </div>
      </div>
    </template>

    <!-- ============ 复盘 ============ -->
    <template v-else-if="mode === 'over' && session">
      <div class="over-hero">
        <div class="oh-title">{{ overTitle }}</div>
        <div class="oh-sub">
          {{
            session.gameOver === 'liquidity'
              ? '家庭现金流断裂——应急储备与流动性管理是财富规划的第一课'
              : '经营期满，看看你的目标达成情况'
          }}
        </div>
      </div>

      <div class="wm-card">
        <div class="card-title">🎯 目标达成情况</div>
        <div v-for="g in session.goals" :key="g.id" class="over-goal">
          <span>{{
            goalStatus(g) === 'done' ? '✅' : goalStatus(g) === 'missed' ? '❌' : '⏳'
          }}</span>
          <span class="og-name">{{ g.label }}（{{ formatMoney(g.targetAmount) }}）</span>
          <span
            class="wm-chip"
            :class="goalStatus(g) === 'done' ? 'ok' : goalStatus(g) === 'missed' ? 'warn' : ''"
          >
            {{
              goalStatus(g) === 'done' ? '达成' : goalStatus(g) === 'missed' ? '未达成' : '进行中'
            }}
          </span>
        </div>
      </div>

      <div class="wm-card">
        <div class="card-title">📕 财富偏差护照</div>
        <div class="passport-grade">{{ session.passport?.grade || '—' }}</div>
        <div v-for="d in session.passport?.dims || []" :key="d.key" class="passport-dim">
          <div class="pd-head">
            <span class="pd-name">{{ d.label }}</span>
            <span class="pd-dots">
              <i v-for="n in 3" :key="n" class="dot" :class="{ on: n <= d.level }"></i>
            </span>
          </div>
          <div class="pd-desc">{{ d.desc }}（出现 {{ d.count }} 次）</div>
        </div>
      </div>

      <div class="end-bar">
        <button class="wm-btn end-btn" @click="restart">🔄 重新开始</button>
      </div>
    </template>

    <!-- 购买弹层 -->
    <Teleport to="body">
      <div v-if="buyTarget" class="buy-backdrop" @click.self="buyTarget = null">
        <div class="buy-sheet">
          <div class="buy-handle"></div>
          <div class="buy-head">
            <span class="buy-emoji">{{ buyTarget.emoji }}</span>
            <div>
              <div class="buy-name">{{ buyTarget.name }}（{{ buyTarget.riskLevel }}）</div>
              <div class="buy-sub">
                年化 {{ buyTarget.yieldBase }}% · {{ buyTarget.liquidity.label }}
              </div>
            </div>
            <button class="buy-close" @click="buyTarget = null">✕</button>
          </div>
          <div class="buy-amount-row">
            <span class="ba-label">买入金额</span>
            <input v-model.number="buyAmount" type="number" class="ba-input" />
            <span class="ba-max" @click="buyAmount = session.cash">全部</span>
          </div>
          <div class="buy-hint">
            可用现金 {{ formatMoney(session.cash) }} · 起投 {{ formatMoney(buyTarget.minAmount) }}
          </div>
          <button class="wm-btn buy-confirm" @click="confirmBuy">确认买入</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.sim-view {
  padding-bottom: 90px;
}

/* 选剧本 */
.sim-hero {
  background: linear-gradient(135deg, #007aff, #0055c8);
  color: #fff;
  padding: 22px 18px 24px;
  border-radius: 0 0 var(--r-xl) var(--r-xl);
}

.sh-title {
  font-size: 19px;
  font-weight: 800;
}

.sh-sub {
  font-size: 11px;
  opacity: 0.9;
  margin-top: 4px;
}

.risk-hint {
  margin-top: 12px;
}

.rh-text {
  font-size: 11.5px;
  color: var(--text-sub);
  margin-bottom: 10px;
}

.wm-btn-block {
  width: 100%;
}

.risk-ok {
  margin: 10px 14px 0;
  font-size: 11.5px;
  color: var(--text-sub);
}

.scenario-card {
  background: #fff;
  border-radius: var(--r-lg);
  padding: 14px;
  margin: 10px 12px;
  box-shadow: var(--shadow-card);
}

.sc-head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.sc-icon {
  font-size: 30px;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sc-name {
  font-size: 14px;
  font-weight: 800;
}

.sc-desc {
  font-size: 10.5px;
  color: var(--text-sub);
  margin-top: 2px;
  line-height: 1.5;
}

.sc-metrics {
  display: flex;
  gap: 8px;
  font-size: 10.5px;
  color: var(--text-sub);
  margin-bottom: 6px;
}

.sc-debt {
  font-size: 10.5px;
  color: #8a6d1f;
  background: #fff6dd;
  border-radius: 8px;
  padding: 5px 9px;
  margin-bottom: 6px;
}

.sc-goals {
  margin-bottom: 10px;
}

.sc-goal {
  font-size: 11px;
  color: var(--text-main);
  margin-bottom: 3px;
}

/* 经营中 */
.play-top {
  background: #fff;
  padding: 12px 14px;
  border-radius: 0 0 var(--r-lg) var(--r-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-card);
}

.pt-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pt-scenario {
  font-size: 13px;
  font-weight: 800;
}

.pt-turn {
  font-size: 10.5px;
  color: var(--text-sub);
}

.pt-econ {
  display: flex;
  gap: 5px;
}

.family-panel {
  margin-top: 10px;
}

.fp-row {
  display: flex;
}

.fp-item {
  flex: 1;
  text-align: center;
}

.fp-item + .fp-item {
  border-left: 0.5px solid var(--separator);
}

.fp-num {
  font-size: 14px;
  font-weight: 800;
}

.fp-label {
  font-size: 10px;
  color: var(--text-sub);
  margin-top: 3px;
}

.settle-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 5px;
}

.goal-row {
  margin-bottom: 10px;
}

.g-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.g-name {
  font-size: 11.5px;
  font-weight: 700;
}

.g-progress {
  height: 6px;
  background: var(--fill);
  border-radius: 999px;
  overflow: hidden;
}

.g-fill {
  height: 100%;
  background: linear-gradient(90deg, #007aff, #5ac8fa);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.g-nums {
  display: flex;
  justify-content: space-between;
  font-size: 9.5px;
  color: var(--text-sub);
  margin-top: 3px;
}

.hold-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 0.5px solid var(--separator);
}

.hold-row:last-child {
  border-bottom: none;
}

.h-emoji {
  font-size: 18px;
}

.h-info {
  flex: 1;
  min-width: 0;
}

.h-name {
  font-size: 11.5px;
  font-weight: 700;
}

.h-sub {
  font-size: 9.5px;
  color: var(--text-sub);
}

.h-amount {
  font-size: 11.5px;
  font-weight: 800;
}

.h-redeem {
  font-size: 10px;
  padding: 4px 10px;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.pending-bar {
  position: fixed;
  left: 50%;
  bottom: 118px;
  transform: translateX(-50%);
  width: min(375px, 100vw);
  background: #fff;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-float);
  padding: 10px 12px;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pending-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.pending-chip {
  font-size: 9.5px;
  font-weight: 700;
  background: #eef4ff;
  color: var(--ios-blue);
  padding: 3px 8px;
  border-radius: 999px;
}

.pending-chip.redeem {
  background: #fff0ef;
  color: var(--ios-red);
}

.pending-clear {
  border: none;
  background: none;
  font-size: 10px;
  color: var(--text-sub);
  cursor: pointer;
  flex-shrink: 0;
}

.end-bar {
  position: fixed;
  left: 50%;
  bottom: 58px;
  transform: translateX(-50%);
  width: min(375px, 100vw);
  padding: 8px 12px 10px;
  z-index: 60;
  background: linear-gradient(transparent, var(--bg) 40%);
}

.end-btn {
  width: 100%;
  padding: 12px;
  font-size: 14px;
}

.log-box {
  margin: 10px 14px 0;
}

.log-line {
  font-size: 9.5px;
  color: var(--text-sub);
  line-height: 1.7;
}

.log-line.fail {
  color: var(--ios-red);
}

.log-line.goal {
  color: #248a3d;
}

/* 复盘 */
.over-hero {
  background: linear-gradient(135deg, #5856d6, #af52de);
  color: #fff;
  padding: 24px 18px 28px;
  border-radius: 0 0 var(--r-xl) var(--r-xl);
  text-align: center;
}

.oh-title {
  font-size: 19px;
  font-weight: 800;
}

.oh-sub {
  font-size: 11px;
  opacity: 0.9;
  margin-top: 6px;
  line-height: 1.6;
}

.over-goal {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 8px;
}

.og-name {
  flex: 1;
  font-weight: 700;
}

.passport-grade {
  font-size: 22px;
  font-weight: 800;
  color: var(--ios-indigo);
  text-align: center;
  margin: 4px 0 12px;
}

.passport-dim {
  margin-bottom: 12px;
}

.pd-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pd-name {
  font-size: 12px;
  font-weight: 700;
}

.pd-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--fill);
}

.dot.on {
  background: var(--ios-red);
}

.pd-desc {
  font-size: 10px;
  color: var(--text-sub);
  margin-top: 3px;
  line-height: 1.5;
}

/* 购买弹层 */
.buy-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 24, 0.45);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.buy-sheet {
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

.buy-handle {
  width: 40px;
  height: 4px;
  background: var(--fill);
  border-radius: 999px;
  margin: 0 auto 12px;
}

.buy-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.buy-emoji {
  font-size: 28px;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.buy-name {
  font-size: 14px;
  font-weight: 800;
}

.buy-sub {
  font-size: 10.5px;
  color: var(--text-sub);
  margin-top: 2px;
}

.buy-close {
  margin-left: auto;
  border: none;
  background: var(--fill);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-sub);
}

.buy-amount-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.ba-label {
  font-size: 12px;
  font-weight: 700;
}

.ba-input {
  flex: 1;
  border: 1px solid #e8ecf0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 700;
  outline: none;
}

.ba-input:focus {
  border-color: var(--ios-blue);
}

.ba-max {
  font-size: 12px;
  font-weight: 700;
  color: var(--ios-blue);
  cursor: pointer;
}

.buy-hint {
  font-size: 10px;
  color: var(--text-sub);
  margin-bottom: 12px;
}

.buy-confirm {
  width: 100%;
  padding: 12px;
}
</style>
