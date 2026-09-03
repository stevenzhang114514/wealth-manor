<script setup>
/**
 * 夺金冒险 · 横屏地牢探险（核心玩法）
 * 地牢房间随机生成且连通，每房间=一个板块（经济作物/粮油/金属/油气）
 * 房间可能有 无/低级/中级/高级箱子；有怪物（=金融风险事件化身，三选博弈）
 * 限时（45~90s 真实倒计时）：移动→开箱→遇怪决策→回入口撤离达标
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
const starting = ref(false)
const remainingMs = ref(0)
const ticker = ref(null)

const CYCLE_LABELS = {
  expansion: '扩张期',
  overheating: '过热期',
  recession: '衰退期',
  recovery: '复苏期',
}
const CYCLE_ICONS = { expansion: '🔥', overheating: '🌋', recession: '📉', recovery: '🌅' }
const CHEST_UI = {
  low: { label: '低级箱', emoji: '📦', color: '#8a8f99' },
  mid: { label: '中级箱', emoji: '🧰', color: '#007aff' },
  high: { label: '高级箱', emoji: '👑', color: '#ff9500' },
}
const QUALITY_STYLE = (q) => ({ borderColor: q?.color, background: (q?.color || '#999') + '18' })

const run = computed(() => adv.run)
const goldPct = computed(() => {
  const r = run.value
  if (!r) return 0
  return Math.min(100, Math.round((r.gold / r.targetGold) * 100))
})
const secondsLeft = computed(() => Math.max(0, Math.ceil(remainingMs.value / 1000)))
const urgent = computed(() => secondsLeft.value <= 10)
const canExtract = computed(() => {
  const r = run.value
  return r && r.status === 'playing' && r.gold >= r.targetGold && r.pos?.x === 0 && r.pos?.y === 1
})
const containerInfo = (id) => containers.value.find((c) => c.id === id)
const sectorOf = (sid) => sectors.value.find((s) => s.id === sid)
const currentRoomData = computed(() => {
  const r = run.value
  if (!r) return null
  return r.dungeon.rooms.find((x) => x.x === r.pos.x && x.y === r.pos.y)
})
const isExplored = (room) => {
  const r = run.value
  if (!r) return false
  for (let i = 0; i < r.explored.length; i += 2) {
    if (r.explored[i] === room.x && r.explored[i + 1] === room.y) return true
  }
  return false
}

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

  const noAuto = new URLSearchParams(location.search).get('no_auto') === '1'
  if (!noAuto && !localStorage.getItem('wm-adventure-started')) {
    localStorage.setItem('wm-adventure-started', '1')
    autoStartNewbie()
  }
})

onBeforeUnmount(() => clearInterval(ticker.value))

const autoStartNewbie = async () => {
  toast('🎁 新手局开启：90 秒地牢限时，达标返回入口撤离！', 'success')
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
    startTimer()
    mode.value = 'running'
  } finally {
    starting.value = false
  }
}

const startTimer = () => {
  clearInterval(ticker.value)
  const r = run.value
  if (!r) return
  // 截图/演示可用 ?pause_timer=1 冻结倒计时
  if (new URLSearchParams(location.search).get('pause_timer') === '1') {
    remainingMs.value = r.timeLimit * 1000
    return
  }
  const sync = () => {
    if (!run.value) return
    remainingMs.value = run.value.startedAt + run.value.timeLimit * 1000 - Date.now()
  }
  sync()
  ticker.value = setInterval(sync, 500)
}

/** 行动 */
const act = async (action) => {
  if (adv.loading || run.value.status !== 'playing') return
  await adv.step(action)
  if (run.value.status === 'busted') {
    clearInterval(ticker.value)
    mode.value = 'result'
    return
  }
  // 每步后同步计时基准
  const r = run.value
  remainingMs.value = r.startedAt + r.timeLimit * 1000 - Date.now()
  if (remainingMs.value <= 0 && r.status === 'playing') {
    // 触发服务端超时校验
    await adv.step({ idle: true })
    if (run.value.status === 'busted') {
      clearInterval(ticker.value)
      mode.value = 'result'
    }
  }
}

const dig = () => act({ open: true })
const fight = () => act({ choice: 'fight' })
const defend = () => act({ choice: 'defend' })
const flee = () => act({ choice: 'flee' })
const moveTo = (dir) => act({ move: dir })

const canMove = (dir) => {
  const r = run.value
  if (!r) return false
  const { x, y } = r.pos
  if (dir === 'left') return x > 0
  if (dir === 'right') return x < r.dungeon.width - 1
  if (dir === 'up') return y > 0
  return y < r.dungeon.height - 1
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
  clearInterval(ticker.value)
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
    <!-- ============ 大厅（竖屏卡页） ============ -->
    <template v-if="mode === 'lobby'">
      <div class="adv-hero">
        <div class="ah-title">🗺️ 夺金冒险 · 地牢探险</div>
        <div class="ah-sub">限时探索地牢 · 开箱摸金 · 返回入口撤离达标</div>
        <div class="ah-rank">
          <span class="wm-chip">🏆 排位分 {{ adv.rankScore }}</span>
          <span class="wm-chip">100金币 = 1元现实收入</span>
        </div>
      </div>

      <div v-for="d in difficulties" :key="d.id" class="diff-card" :class="d.id">
        <div class="dc-head">
          <span class="dc-icon">{{ d.icon }}</span>
          <div class="dc-info">
            <div class="dc-name">{{ d.name }}模式</div>
            <div class="dc-desc">{{ d.desc }}</div>
          </div>
        </div>
        <div class="dc-metrics">
          <span>⏱️ 限时 {{ d.timeLimit }}s</span>
          <span>🎯 目标 {{ d.startGold * d.targetMultiple }} 金币</span>
          <span>🏆 排位×{{ d.rankFactor }}</span>
        </div>
        <button class="wm-btn dc-btn" :disabled="starting" @click="begin(d.id)">🗺️ 进入地牢</button>
      </div>

      <div class="wm-card">
        <div class="card-title">📦 容器（投资方式）· 最多2个</div>
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
              波动×{{ c.volFactor }} · 副收益{{ Math.round(c.sideChance * 100) }}% · 升级{{
                Math.round(c.upgradeChance * 100)
              }}%
            </span>
            <span v-if="c.lock" class="c-lock">🔒 {{ c.lock.reason }}</span>
          </div>
        </div>
        <button class="wm-btn ghost gear-risk-btn" @click="router.push('/risk')">
          🛡️ 装备解锁评估
        </button>
      </div>

      <div class="wm-card">
        <div class="card-title">🗺️ 地牢房间板块（掉落物预览）</div>
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
              :title="`${it.name}（基础${it.baseValue}）`"
              >{{ it.emoji }}</span
            >
          </div>
        </div>
      </div>
      <div class="dungeon-tip">
        💡 地牢房间随机连通 · 箱子分级 📦低/🧰中/👑高 · 怪物=金融风险事件，可迎战/防御/逃离
      </div>
    </template>

    <!-- ============ 横屏地牢 ============ -->
    <template v-else-if="mode === 'running' && run">
      <div class="dungeon-canvas">
        <!-- 左侧：地牢地图 -->
        <div class="map-panel">
          <svg viewBox="0 0 420 320" class="dungeon-map">
            <defs>
              <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3a3f4b" />
                <stop offset="100%" stop-color="#262a33" />
              </linearGradient>
            </defs>
            <rect width="420" height="320" fill="url(#stone)" rx="14" />
            <!-- 地图标题 -->
            <text
              x="210"
              y="22"
              text-anchor="middle"
              fill="#8a8f99"
              font-size="11"
              font-weight="700"
            >
              地牢 · 房间=板块 · 随机连通
            </text>
            <!-- 房间 -->
            <g v-for="room in run.dungeon.rooms" :key="room.id">
              <rect
                :x="room.x * 100 + 14"
                :y="room.y * 100 + 36"
                width="86"
                height="82"
                rx="10"
                :fill="
                  isExplored(room) ? (sectorOf(room.sectorId)?.color || '#555') + '33' : '#1c1f26'
                "
                :stroke="
                  run.pos.x === room.x && run.pos.y === room.y
                    ? '#ffd54f'
                    : room.x === 0 && room.y === 1
                      ? '#34c759'
                      : '#555b66'
                "
                :stroke-width="run.pos.x === room.x && run.pos.y === room.y ? 3 : 1.5"
              />
              <!-- 探索过的房间内容 -->
              <template v-if="isExplored(room)">
                <text
                  :x="room.x * 100 + 57"
                  :y="room.y * 100 + 62"
                  text-anchor="middle"
                  font-size="22"
                >
                  {{ sectorOf(room.sectorId)?.icon }}
                </text>
                <text
                  :x="room.x * 100 + 57"
                  :y="room.y * 100 + 108"
                  text-anchor="middle"
                  fill="#cfd4dc"
                  font-size="9"
                >
                  {{ sectorOf(room.sectorId)?.name }}
                </text>
                <text
                  v-if="room.chest"
                  :x="room.x * 100 + 86"
                  :y="room.y * 100 + 100"
                  text-anchor="middle"
                  font-size="16"
                >
                  {{ CHEST_UI[room.chest].emoji }}
                </text>
                <text
                  v-if="room.monster"
                  :x="room.x * 100 + 28"
                  :y="room.y * 100 + 100"
                  text-anchor="middle"
                  font-size="18"
                >
                  {{ room.monster.icon }}
                </text>
              </template>
              <text
                v-else
                :x="room.x * 100 + 57"
                :y="room.y * 100 + 80"
                text-anchor="middle"
                fill="#4a4f59"
                font-size="20"
              >
                ?
              </text>
              <!-- 入口标注 -->
              <text
                v-if="room.x === 0 && room.y === 1"
                :x="room.x * 100 + 57"
                :y="room.y * 100 + 118"
                text-anchor="middle"
                fill="#34c759"
                font-size="8"
              >
                🚪入口=撤离
              </text>
            </g>
            <!-- 玩家 -->
            <g v-if="run.pos">
              <circle
                :cx="run.pos.x * 100 + 57"
                :cy="run.pos.y * 100 + 60"
                r="17"
                fill="#ffd54f"
                opacity="0.3"
                class="player-pulse"
              />
              <text
                :x="run.pos.x * 100 + 57"
                :y="run.pos.y * 100 + 67"
                text-anchor="middle"
                font-size="20"
              >
                🧑‍🌾
              </text>
            </g>
          </svg>
          <div class="map-foot">⬛ 未探索 · 📦低箱 🧰中箱 👑高箱 · 👹 怪物（金融风险事件）</div>
        </div>

        <!-- 右侧：HUD 与行动 -->
        <div class="hud-panel">
          <!-- 倒计时 -->
          <div class="timer-box" :class="{ urgent }">
            <span class="timer-num">{{ secondsLeft }}</span>
            <span class="timer-label">秒 · 限时撤离</span>
          </div>

          <!-- 金币目标 -->
          <div class="gold-box">
            <div class="gb-gold">🪙 {{ Math.round(run.gold) }}</div>
            <div class="gb-progress">
              <div class="gb-fill" :style="{ width: goldPct + '%' }"></div>
            </div>
            <div class="gb-target">目标 {{ run.targetGold }}</div>
          </div>

          <!-- 当前房间信息 -->
          <div class="room-info">
            <div class="ri-name">
              {{ sectorOf(currentRoomData?.sectorId)?.icon }} 当前位置：{{
                sectorOf(currentRoomData?.sectorId)?.name
              }}
            </div>
            <div class="ri-meta">
              <span class="wm-chip"
                >{{ CYCLE_ICONS[run.econCycle] }} {{ CYCLE_LABELS[run.econCycle] }}</span
              >
              <span class="wm-chip"
                >{{ containerInfo(run.currentContainer)?.emoji }}
                {{ containerInfo(run.currentContainer)?.name }}</span
              >
            </div>
            <div class="container-switch">
              <span class="cs-label">切换容器：</span>
              <button
                v-for="cid in run.containers"
                :key="cid"
                class="cs-chip"
                :class="{ on: run.currentContainer === cid }"
                @click="act({ containerId: cid })"
              >
                {{ containerInfo(cid)?.emoji }} {{ containerInfo(cid)?.name }}
              </button>
            </div>
          </div>

          <!-- 行动区 -->
          <div class="action-area">
            <template v-if="currentRoomData?.monster">
              <!-- 遭遇卡 -->
              <div class="encounter-card">
                <div class="ec-icon">{{ currentRoomData.monster.icon }}</div>
                <div class="ec-body">
                  <div class="ec-title">👹 {{ currentRoomData.monster.name }}</div>
                  <div class="ec-desc">{{ currentRoomData.monster.desc }}</div>
                </div>
              </div>
              <div class="enc-actions">
                <button class="wm-btn enc-btn fight" :disabled="adv.loading" @click="fight">
                  ⚔️ 迎战
                </button>
                <button class="wm-btn enc-btn defend" :disabled="adv.loading" @click="defend">
                  🛡️ 防御
                </button>
                <button class="wm-btn ghost enc-btn flee" :disabled="adv.loading" @click="flee">
                  🏃 逃离
                </button>
              </div>
            </template>
            <template v-else-if="currentRoomData?.chest">
              <div
                class="chest-card"
                :style="{ borderColor: CHEST_UI[currentRoomData.chest].color }"
              >
                <span class="cc-emoji">{{ CHEST_UI[currentRoomData.chest].emoji }}</span>
                <span class="cc-name">{{ CHEST_UI[currentRoomData.chest].label }}</span>
                <button class="wm-btn open-btn" :disabled="adv.loading" @click="dig">
                  🔓 开箱
                </button>
              </div>
            </template>
            <template v-else>
              <div class="empty-tip">
                {{ canExtract ? '✅ 已达标！点击撤离结束本局' : '此房间空空如也，前往其他房间' }}
              </div>
            </template>
            <!-- 移动方向 -->
            <div class="move-pad">
              <button class="mv up" :disabled="!canMove('up') || adv.loading" @click="moveTo('up')">
                ⬆️
              </button>
              <div class="mv-row">
                <button
                  class="mv left"
                  :disabled="!canMove('left') || adv.loading"
                  @click="moveTo('left')"
                >
                  ⬅️
                </button>
                <button
                  class="mv center"
                  :class="{ ready: canExtract }"
                  :disabled="!canExtract || adv.loading"
                  @click="extract"
                >
                  🚪{{ canExtract ? '撤离' : '' }}
                </button>
                <button
                  class="mv right"
                  :disabled="!canMove('right') || adv.loading"
                  @click="moveTo('right')"
                >
                  ➡️
                </button>
              </div>
              <button
                class="mv down"
                :disabled="!canMove('down') || adv.loading"
                @click="moveTo('down')"
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近开箱结果 -->
      <div
        v-if="run.lastStep"
        :key="run.chestOpened"
        class="loot-strip"
        :style="QUALITY_STYLE(run.lastStep.quality)"
      >
        <span class="ls-quality" :style="{ color: run.lastStep.quality.color }">
          {{ run.lastStep.quality.emoji }} {{ run.lastStep.quality.name }}
          <em v-if="run.lastStep.upgraded" class="ls-up">⬆️升级</em>
          <em v-if="run.lastStep.crit" class="ls-crit">💥暴击</em>
        </span>
        <span class="ls-loot">{{ run.lastStep.loot.emoji }} {{ run.lastStep.loot.name }}</span>
        <span class="ls-chest">{{ CHEST_UI[run.lastStep.chest?.tier]?.label }}</span>
        <span class="ls-value" :class="run.lastStep.value >= 0 ? 'up' : 'down'">
          {{ run.lastStep.value >= 0 ? '+' : '' }}{{ run.lastStep.value }} 金币
        </span>
        <span v-if="run.lastStep.sideIncome" class="ls-side"
          >+{{ run.lastStep.sideIncome }} 副收益</span
        >
      </div>

      <!-- 事件日志（横条） -->
      <div class="dungeon-log">
        <div v-for="(l, i) in run.log.slice(-6)" :key="i" class="dl-line">{{ l.text }}</div>
      </div>
    </template>

    <!-- ============ 结算 ============ -->
    <template v-else-if="mode === 'result' && run">
      <div class="result-hero" :class="{ busted: run.status === 'busted' }">
        <div class="re-title">
          {{
            run.status === 'extracted'
              ? '🎉 撤离成功'
              : run.status === 'busted' && run.result?.reason === 'timeout'
                ? '⏰ 时间耗尽'
                : '💀 血本无归'
          }}
        </div>
        <template v-if="run.status === 'extracted'">
          <div class="re-gold">+{{ run.result.profit }} 🪙</div>
          <div class="re-line">折算现实收入 ¥{{ run.result.realIncomeYuan }}（100金币=1元）</div>
          <div class="re-line">排位分 +{{ run.result.rankScore }}</div>
          <div class="re-line">开箱 {{ run.result.turn }} 次 · 金币已入庄园，可购买装饰与家具</div>
        </template>
        <template v-else>
          <div class="re-line">本局失败——地牢探险中，时间管理与风险应对同样重要</div>
        </template>
      </div>
      <div class="wm-card">
        <div class="card-title">📜 本局回顾</div>
        <div v-for="(l, i) in run.log" :key="i" class="review-line">{{ l.text }}</div>
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
  padding-bottom: 16px;
}

/* 大厅 */
.adv-hero {
  background: linear-gradient(135deg, #3a2a1a, #5b3a1e 60%, #8a5a2b);
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
}
.dc-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 10.5px;
  color: var(--text-sub);
  margin-bottom: 10px;
}
.dc-btn {
  width: 100%;
  padding: 11px;
}
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
.gear-risk-btn {
  width: 100%;
}
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
.dungeon-tip {
  margin: 10px 14px 0;
  font-size: 10px;
  color: var(--text-sub);
  text-align: center;
  line-height: 1.7;
}

/* ===== 横屏地牢画布 ===== */
.dungeon-canvas {
  display: flex;
  gap: 10px;
  padding: 10px 12px 0;
  max-width: 860px;
  margin: 0 auto;
}

.map-panel {
  flex: 1.4;
  min-width: 0;
}

.dungeon-map {
  width: 100%;
  display: block;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.player-pulse {
  animation: pulse 1.4s ease infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.25);
    opacity: 0.1;
  }
}

.map-foot {
  font-size: 9px;
  color: var(--text-sub);
  margin-top: 5px;
  text-align: center;
}

.hud-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timer-box {
  background: #2c2c33;
  color: #ffd54f;
  border-radius: 14px;
  padding: 8px 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.timer-box.urgent {
  animation: blinkBg 0.6s ease infinite;
}

@keyframes blinkBg {
  0%,
  100% {
    background: #2c2c33;
  }
  50% {
    background: #7a1a1a;
  }
}

.timer-num {
  font-size: 26px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.timer-label {
  font-size: 11px;
  opacity: 0.9;
}

.gold-box {
  background: #fff;
  border-radius: 14px;
  padding: 8px 12px;
}

.gb-gold {
  font-size: 18px;
  font-weight: 800;
  color: #b07d1a;
}
.gb-progress {
  height: 7px;
  background: var(--fill);
  border-radius: 999px;
  overflow: hidden;
  margin: 5px 0 3px;
}
.gb-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd54f, #ff9500);
  border-radius: 999px;
  transition: width 0.4s;
}
.gb-target {
  font-size: 9.5px;
  color: var(--text-sub);
}

.room-info {
  background: #fff;
  border-radius: 14px;
  padding: 9px 12px;
}

.ri-name {
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 6px;
}
.ri-meta {
  display: flex;
  gap: 5px;
  margin-bottom: 7px;
}

.container-switch {
  display: flex;
  align-items: center;
  gap: 5px;
}

.cs-label {
  font-size: 9.5px;
  color: var(--text-sub);
  flex-shrink: 0;
}
.cs-chip {
  flex: 1;
  border: 1px solid #e0e4e8;
  background: #fff;
  border-radius: 999px;
  padding: 5px 0;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.cs-chip.on {
  border-color: var(--ios-blue);
  background: #eef4ff;
  color: var(--ios-blue);
}

.action-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.encounter-card {
  display: flex;
  gap: 8px;
  background: linear-gradient(135deg, #2c2c33, #3d2a2a);
  border-radius: 14px;
  padding: 10px 12px;
  align-items: center;
  animation: ebIn 0.3s ease both;
}

.ec-icon {
  font-size: 30px;
}
.ec-title {
  font-size: 13px;
  font-weight: 800;
  color: #ff6b6b;
}
.ec-desc {
  font-size: 9px;
  color: #cfd4dc;
  line-height: 1.5;
  margin-top: 2px;
}
.enc-actions {
  display: flex;
  gap: 6px;
}
.enc-btn {
  flex: 1;
  font-size: 11px;
  padding: 8px 0;
}
.enc-btn.fight {
  background: linear-gradient(135deg, #ff3b30, #d7263d);
}
.enc-btn.defend {
  background: linear-gradient(135deg, #5ac8fa, #007aff);
}
.enc-btn.flee {
  background: transparent;
  color: #cfd4dc;
  border: 1px solid #666;
}

.chest-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 2px solid;
  border-radius: 14px;
  padding: 10px 12px;
  animation: ebIn 0.3s ease both;
}

.cc-emoji {
  font-size: 26px;
}
.cc-name {
  font-size: 13px;
  font-weight: 800;
  flex: 1;
}
.open-btn {
  font-size: 12px;
  padding: 8px 16px;
}

.empty-tip {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 10.5px;
  color: var(--text-sub);
  text-align: center;
}

/* 移动十字键 */
.move-pad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mv-row {
  display: flex;
  gap: 4px;
  align-items: center;
}
.mv {
  width: 46px;
  height: 38px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.mv:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.mv.center {
  background: #8a8f99;
  color: #fff;
  width: 60px;
}
.mv.center.ready {
  background: var(--ios-green);
  animation: pulse 1.2s ease infinite;
}

@keyframes ebIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loot-strip {
  max-width: 860px;
  margin: 8px auto 0;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid;
  border-radius: 12px;
  background: #fff;
  padding: 7px 14px;
  font-size: 11.5px;
  animation: ebIn 0.3s ease both;
}

.ls-quality {
  font-weight: 800;
}
.ls-up {
  font-style: normal;
  color: var(--ios-indigo);
  margin-left: 4px;
  font-size: 9.5px;
}
.ls-crit {
  font-style: normal;
  color: #e65100;
  margin-left: 4px;
  font-size: 9.5px;
}
.ls-loot {
  font-weight: 700;
}
.ls-chest {
  font-size: 9.5px;
  color: var(--text-sub);
}
.ls-value {
  font-weight: 800;
  margin-left: auto;
}
.ls-side {
  font-size: 9.5px;
  color: #8a6d1f;
  background: #fff6dd;
  border-radius: 999px;
  padding: 1px 8px;
}

.dungeon-log {
  max-width: 860px;
  margin: 8px auto 0;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dl-line {
  font-size: 10px;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  padding: 4px 10px;
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
  font-size: 10.5px;
  margin-bottom: 5px;
  line-height: 1.5;
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
}

@media (max-width: 560px) {
  .dungeon-canvas {
    flex-direction: column;
  }
  .action-area {
    min-height: 150px;
  }
}
</style>
