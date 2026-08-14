<script setup>
/**
 * 好友 + 排行榜：互访庄园、浇水互动、月度配置合理性 PK 排名
 */
import { ref, onMounted } from 'vue'
import { getFriends, visitFriend, waterFriend, getLeaderboard } from '../api/social.js'
import { useManorStore } from '../stores/manor.js'
import { toast, flyCoin } from '../utils/toast.js'
import BackHeader from '../components/BackHeader.vue'
import SegmentedControl from '../components/SegmentedControl.vue'

const TABS = [
  { key: 'friends', label: '🤝 好友' },
  { key: 'board', label: '🏆 排行PK' },
]

const manor = useManorStore()
const tab = ref('friends')
const friends = ref([])
const leaderboard = ref(null)
const visiting = ref(null) // 访问中的好友
const watering = ref('')

const load = async () => {
  friends.value = await getFriends()
}

onMounted(() => {
  load()
  loadBoard()
})

const loadBoard = async () => {
  leaderboard.value = await getLeaderboard()
}

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

const onVisit = async (f) => {
  const res = await visitFriend(f.id)
  visiting.value = { ...res.friend, weather: res.weather }
}

const onWater = async (f) => {
  watering.value = f.id
  try {
    const res = await waterFriend(f.id)
    manor.setState(res.manor)
    await load()
    flyCoin(`+${res.rewards.coins} 🪙`)
    toast(`给 ${f.name} 浇水成功，双方各 +${res.rewards.coins} 金币`, 'success')
  } catch {
    // 错误提示由拦截器统一弹出
  } finally {
    watering.value = ''
  }
}

/** 访问弹层内浇水：浇水后关闭弹层 */
const waterFromVisit = async () => {
  const f = visiting.value
  if (!f) return
  await onWater(f)
  visiting.value = null
}
</script>

<template>
  <div class="social-view">
    <BackHeader title="👥 好友与排行" />

    <SegmentedControl v-model="tab" :options="TABS" />

    <!-- 好友列表 -->
    <div v-if="tab === 'friends'" class="friend-list">
      <div v-for="f in friends" :key="f.id" class="friend-card">
        <div class="f-avatar">
          {{ f.avatar }}
          <span class="online-dot" :class="{ off: !f.online }"></span>
        </div>
        <div class="f-info">
          <div class="f-name">
            {{ f.name }} <span class="f-manor">🏡 {{ f.manorName }}</span>
          </div>
          <div class="f-bio">{{ f.bio }} · Lv.{{ f.level }} · 配置分 {{ f.score }}</div>
          <div class="f-plants">
            <span v-for="(p, i) in f.plants" :key="i" class="f-plant" :title="p.species">{{
              p.emoji
            }}</span>
          </div>
        </div>
        <div class="f-actions">
          <button class="wm-btn ghost mini" @click="onVisit(f)">访问</button>
          <button
            class="wm-btn mini"
            :disabled="f.watered || watering === f.id"
            @click="onWater(f)"
          >
            {{ f.watered ? '💧已浇' : '浇水' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 排行榜 -->
    <div v-else-if="leaderboard" class="board-list">
      <div class="board-summary">
        <div class="bs-item">
          <div class="bs-num">{{ leaderboard.summary.selfRank }}</div>
          <div class="bs-label">我的排名</div>
        </div>
        <div class="bs-item">
          <div class="bs-num">{{ leaderboard.summary.selfScore }}</div>
          <div class="bs-label">我的评分</div>
        </div>
        <div class="bs-item">
          <div class="bs-num">{{ leaderboard.summary.participants }}</div>
          <div class="bs-label">参赛庄园</div>
        </div>
        <div class="bs-month">{{ leaderboard.summary.month }}</div>
      </div>

      <div v-for="u in leaderboard.list" :key="u.id" class="board-row" :class="{ self: u.isSelf }">
        <span class="b-rank">{{ MEDALS[u.rank] || u.rank }}</span>
        <span class="b-avatar">{{ u.avatar }}</span>
        <div class="b-info">
          <div class="b-name">
            {{ u.name }} <span class="b-manor">🏡 {{ u.manorName }}</span>
          </div>
          <div class="b-sub">Lv.{{ u.level }} · 月度资产配置合理性</div>
        </div>
        <span class="b-score">{{ u.score }}</span>
      </div>
      <div class="board-explain">{{ leaderboard.summary.scoreExplain }}</div>
    </div>

    <!-- 好友庄园访问弹层 -->
    <Teleport to="body">
      <div v-if="visiting" class="visit-backdrop" @click.self="visiting = null">
        <div class="visit-sheet">
          <div class="visit-head">
            <div>
              <div class="visit-name">{{ visiting.avatar }} {{ visiting.manorName }}</div>
              <div class="visit-owner">庄主：{{ visiting.name }} · Lv.{{ visiting.level }}</div>
            </div>
            <button class="visit-close" @click="visiting = null">✕</button>
          </div>
          <div class="visit-scene">
            <div class="visit-sky">
              <span class="visit-weather"
                >{{ visiting.weather.icon }} {{ visiting.weather.label }}</span
              >
              <span class="visit-sun">☀️</span>
            </div>
            <div class="visit-ground">
              <div v-for="(p, i) in visiting.plants" :key="i" class="visit-plot">
                <span class="v-plant">{{ p.emoji }}</span>
              </div>
            </div>
          </div>
          <div class="visit-tip">{{ visiting.weather.tip }}</div>
          <button class="wm-btn visit-btn" :disabled="visiting.watered" @click="waterFromVisit">
            {{ visiting.watered ? '💧 今天已浇过水' : '🌧️ 给植物浇水 (+5金币)' }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.social-view {
  padding-bottom: 14px;
}

.friend-list {
  margin: 10px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.friend-card {
  display: flex;
  gap: 10px;
  align-items: center;
  background: #fff;
  border-radius: var(--radius);
  padding: 12px;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.04);
}

.f-avatar {
  position: relative;
  font-size: 26px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.online-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ios-green);
  border: 2px solid #fff;
}

.online-dot.off {
  background: #c4c9d0;
}

.f-info {
  flex: 1;
  min-width: 0;
}

.f-name {
  font-size: 13px;
  font-weight: 800;
}

.f-manor {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-sub);
}

.f-bio {
  font-size: 10px;
  color: var(--text-sub);
  margin: 2px 0 5px;
}

.f-plants {
  display: flex;
  gap: 4px;
}

.f-plant {
  font-size: 15px;
}

.f-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
}

.mini {
  font-size: 10.5px;
  padding: 6px 11px;
}

/* 排行榜 */
.board-list {
  margin: 10px 12px 0;
}

.board-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #fff6dd, #ffe9b0);
  border: 1px solid #f2dc9a;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 10px;
}

.bs-item {
  text-align: center;
  flex: 1;
}

.bs-num {
  font-size: 19px;
  font-weight: 800;
  color: #8a6d1f;
}

.bs-label {
  font-size: 9.5px;
  color: #a08a4e;
}

.bs-month {
  font-size: 10px;
  color: #a08a4e;
  writing-mode: vertical-rl;
}

.board-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 6px;
  box-shadow: 0 2px 6px rgba(31, 45, 61, 0.04);
}

.board-row.self {
  background: #eef4ff;
  border: 1.5px solid var(--ios-blue);
}

.b-rank {
  width: 26px;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

.b-avatar {
  font-size: 20px;
}

.b-info {
  flex: 1;
  min-width: 0;
}

.b-name {
  font-size: 12.5px;
  font-weight: 700;
}

.b-manor {
  font-size: 10px;
  color: var(--text-sub);
  font-weight: 600;
}

.b-sub {
  font-size: 9.5px;
  color: var(--text-sub);
}

.b-score {
  font-size: 16px;
  font-weight: 800;
  color: var(--ios-blue);
}

.board-explain {
  font-size: 9.5px;
  color: var(--text-sub);
  text-align: center;
  margin-top: 8px;
}

/* 访问弹层 */
.visit-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 24, 0.45);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.visit-sheet {
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

.visit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.visit-name {
  font-size: 15px;
  font-weight: 800;
}

.visit-owner {
  font-size: 11px;
  color: var(--text-sub);
}

.visit-close {
  border: none;
  background: #f2f3f5;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: var(--text-sub);
  cursor: pointer;
}

.visit-scene {
  border-radius: 14px;
  overflow: hidden;
}

.visit-sky {
  position: relative;
  height: 76px;
  background: linear-gradient(#dff3ff, #f0f8ff);
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
}

.visit-weather {
  font-size: 12px;
  font-weight: 700;
}

.visit-sun {
  position: absolute;
  right: 14px;
  top: 8px;
  font-size: 26px;
}

.visit-ground {
  background: #a8c686;
  padding: 10px 14px 14px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.visit-plot {
  width: 52px;
  height: 46px;
  border-radius: 10px;
  background: #c9a66b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-plant {
  font-size: 24px;
}

.visit-tip {
  font-size: 11px;
  color: var(--manor-green);
  margin: 10px 0;
}

.visit-btn {
  width: 100%;
}
</style>
