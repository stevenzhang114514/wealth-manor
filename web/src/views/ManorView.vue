<script setup>
/**
 * 庄园主页：天气（行情）+ 植物（持仓）+ 等级经验 + 任务/看板快捷入口
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useManorStore } from '../stores/manor.js'
import { getManorPlants } from '../api/manor.js'
import WeatherBadge from '../components/manor/WeatherBadge.vue'
import LevelBar from '../components/manor/LevelBar.vue'
import ManorScene from '../components/manor/ManorScene.vue'
import PlantCard from '../components/manor/PlantCard.vue'

const router = useRouter()
const manor = useManorStore()
const plants = ref([])
const selected = ref(null)

onMounted(async () => {
  await manor.refresh()
  plants.value = await getManorPlants()
})

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

    <!-- 庄园场景 -->
    <ManorScene :plants="plants" :weather="manor.weather" @select="selected = $event" />

    <!-- 快捷入口 -->
    <div class="quick-actions">
      <button class="wm-btn" @click="go('/tasks')">📋 今日任务</button>
      <button class="wm-btn ghost" @click="go('/assets')">📊 资产看板</button>
    </div>

    <div class="scene-tip">
      💡 点击庄园里的植物，查看它关联的真实理财产品与收益
    </div>

    <PlantCard :plant="selected" @close="selected = null" />
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

.quick-actions {
  display: flex;
  gap: 10px;
  margin: 10px 12px 0;
}

.quick-actions .wm-btn {
  flex: 1;
}

.scene-tip {
  text-align: center;
  font-size: 10.5px;
  color: var(--text-sub);
  margin-top: 10px;
}
</style>
