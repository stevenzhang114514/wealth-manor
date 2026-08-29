<script setup>
/**
 * 庄园主页：天气（行情）+ 植物（持仓）+ 等级经验 + 快捷入口宫格
 * 首次进入自动触发新手引导；成熟植物可收获（产品到期赎回映射）
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useManorStore } from '../stores/manor.js'
import { getManorPlants, harvestPlant } from '../api/manor.js'
import { getInventory } from '../api/shop.js'
import { toast, flyCoin } from '../utils/toast.js'
import WeatherBadge from '../components/manor/WeatherBadge.vue'
import LevelBar from '../components/manor/LevelBar.vue'
import ManorScene from '../components/manor/ManorScene.vue'
import PlantCard from '../components/manor/PlantCard.vue'

const router = useRouter()
const manor = useManorStore()
const plants = ref([])
const decorations = ref([])
const selected = ref(null)

const SHORTCUTS = [
  { icon: '🛍️', label: '庄园商城', to: '/shop' },
  { icon: '👥', label: '好友排行', to: '/social' },
  { icon: '🤖', label: 'AI助手', to: '/chat' },
  { icon: '🎓', label: '知识答题', to: '/quiz' },
]

onMounted(async () => {
  // 首次进入自动触发新手引导（截图/演示可用 ?skip_onboard=1 跳过）
  const skip = new URLSearchParams(location.search).get('skip_onboard') === '1'
  if (!skip && !localStorage.getItem('wm-onboarded')) {
    router.replace('/onboarding')
    return
  }
  await loadAll()
})

const loadAll = async () => {
  await manor.refresh()
  const [ps, inv] = await Promise.all([getManorPlants(), getInventory()])
  plants.value = ps
  decorations.value = inv.equippedDecorations
}

/** 收获成熟植物：奖励入账 + 金币飞入动画 + 植物归档 */
const onHarvest = async (plant) => {
  try {
    const res = await harvestPlant(plant.id)
    manor.setState(res.manor)
    selected.value = null
    await loadAll()
    flyCoin(`+${res.rewards.coins} 🪙 +${res.rewards.exp} ⭐`)
    toast(`🌾 丰收！「${res.plant.speciesName}」奖励已入账`, 'success')
  } catch {
    // 错误提示由拦截器统一弹出
  }
}

const go = (path) => router.push(path)
</script>

<template>
  <div class="manor-view">
    <!-- 庄园信息头 -->
    <div class="manor-header">
      <div class="title-row">
        <div class="name-box">
          <span class="manor-name">🏡 {{ manor.state?.name || '加载中…' }}</span>
          <span v-if="manor.state" class="wm-chip">{{ manor.state.style }}庄园</span>
        </div>
        <WeatherBadge :weather="manor.weather" />
      </div>
      <LevelBar
        v-if="manor.state"
        :level="manor.state.level"
        :exp="manor.state.exp"
        :exp-to-next="manor.state.expToNext"
        :stage-name="manor.state.stageName"
      />
      <div v-if="manor.state" class="currency-row">
        <span class="coin">🪙 {{ manor.state.coins }}</span>
        <span class="coin">💎 {{ manor.state.diamonds }}</span>
        <span class="coin">🏅 {{ manor.state.honorPoints }}</span>
        <span class="coin-tip">金币/钻石/荣誉点</span>
      </div>
    </div>

    <!-- 天气提示 -->
    <div v-if="manor.weather" class="weather-tip">
      {{ manor.weather.icon }} {{ manor.weather.tip }}
    </div>

    <!-- 财富人生模拟器入口 -->
    <div class="sim-entry" @click="go('/simulator')">
      <div class="se-icon">🧭</div>
      <div class="se-info">
        <div class="se-title">财富人生模拟器</div>
        <div class="se-sub">产品即英雄 · 风评定阵容 · 回合制经营你的家庭财富</div>
      </div>
      <span class="se-arrow">›</span>
    </div>

    <!-- 庄园场景 -->
    <ManorScene
      :plants="plants"
      :weather="manor.weather"
      :decorations="decorations"
      @select="selected = $event"
    />

    <!-- 快捷入口宫格 -->
    <div class="shortcut-grid">
      <button v-for="s in SHORTCUTS" :key="s.to" class="shortcut" @click="go(s.to)">
        <span class="s-icon">{{ s.icon }}</span>
        <span class="s-label">{{ s.label }}</span>
      </button>
    </div>

    <div class="scene-tip">💡 点击庄园里的植物查看持仓；成熟后点击「收获」领取丰收奖励</div>

    <PlantCard :plant="selected" @close="selected = null" @harvest="onHarvest" />
  </div>
</template>

<style scoped>
.manor-view {
  padding-bottom: 12px;
}

.manor-header {
  background: #fff;
  border-radius: 0 0 18px 18px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.05);
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name-box {
  display: flex;
  align-items: center;
  gap: 7px;
}

.manor-name {
  font-size: 15px;
  font-weight: 800;
}

.currency-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.coin {
  font-size: 11px;
  font-weight: 700;
  background: #f7f8fa;
  padding: 3px 9px;
  border-radius: 999px;
}

.coin-tip {
  font-size: 9.5px;
  color: var(--text-sub);
}

.weather-tip {
  margin: 10px 12px 0;
  background: linear-gradient(135deg, #eef6ee, #e4f0e4);
  color: var(--manor-green);
  font-size: 11.5px;
  font-weight: 600;
  padding: 9px 12px;
  border-radius: 12px;
}

.sim-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 12px 0;
  background: linear-gradient(135deg, #007aff, #0055c8);
  color: #fff;
  border-radius: var(--r-lg);
  padding: 12px 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 122, 255, 0.3);
  transition: transform 0.12s ease;
}

.sim-entry:active {
  transform: scale(0.98);
}

.se-icon {
  font-size: 26px;
}

.se-info {
  flex: 1;
}

.se-title {
  font-size: 13.5px;
  font-weight: 800;
}

.se-sub {
  font-size: 10px;
  opacity: 0.85;
  margin-top: 2px;
}

.se-arrow {
  font-size: 20px;
  opacity: 0.8;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 10px 12px 0;
}

.shortcut {
  border: none;
  background: #fff;
  border-radius: 13px;
  padding: 11px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.05);
  transition: transform 0.12s ease;
}

.shortcut:active {
  transform: scale(0.94);
}

.s-icon {
  font-size: 21px;
}

.s-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-main);
}

.scene-tip {
  text-align: center;
  font-size: 10.5px;
  color: var(--text-sub);
  margin-top: 10px;
}
</style>
