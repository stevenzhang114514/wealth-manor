<script setup>
/**
 * 资产看板：总净资产 → 配置饼图 → 30天趋势 → 健康度 → AI建议 → 财富树
 */
import { onMounted, ref } from 'vue'
import { getAssetOverview, getAssetTrend, getHealthScore } from '../api/assets.js'
import { getPortfolioAdvice } from '../api/ai.js'
import { formatMoney, formatSigned, formatPct } from '../utils/format.js'
import { toast } from '../utils/toast.js'
import PieChart from '../components/assets/PieChart.vue'
import TrendChart from '../components/assets/TrendChart.vue'
import HealthRing from '../components/assets/HealthRing.vue'
import WealthTree from '../components/assets/WealthTree.vue'
import AdviceCard from '../components/assets/AdviceCard.vue'

const overview = ref(null)
const trend = ref([])
const health = ref(null)
const advice = ref(null)

onMounted(async () => {
  const [ov, tr, hs, adv] = await Promise.all([
    getAssetOverview(),
    getAssetTrend(30),
    getHealthScore(),
    getPortfolioAdvice(),
  ])
  overview.value = ov
  trend.value = tr.points
  health.value = hs
  advice.value = adv
})

const addAsset = () => toast('资产导入（演示版）：支持自动同步/扫码/OCR/手动四通道')
</script>

<template>
  <div class="asset-view">
    <!-- 净资产总览 -->
    <div class="asset-hero">
      <div class="hero-label">总净资产（元）</div>
      <div class="hero-value">{{ overview ? formatMoney(overview.netWorth) : '--' }}</div>
      <div v-if="overview" class="hero-change">
        <span :class="overview.todayChange >= 0 ? 'up' : 'down'">
          今日 {{ formatSigned(overview.todayChange) }}（{{ formatPct(overview.todayChangePct) }}）
        </span>
      </div>
      <div v-if="overview" class="hero-sub">
        总资产 {{ formatMoney(overview.totalAssets) }} · 负债
        {{ formatMoney(overview.totalLiabilities) }}
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="entry-row">
      <router-link to="/import" class="entry-item">➕ 资产导入</router-link>
      <router-link to="/goals" class="entry-item">🎯 目标规划</router-link>
    </div>

    <!-- 资产配置 -->
    <div class="wm-card">
      <div class="card-title">🧺 资产配置分布</div>
      <PieChart :categories="overview?.categories || []" />
    </div>

    <!-- 净资产趋势 -->
    <div class="wm-card">
      <div class="card-title">📈 近30天净资产趋势</div>
      <TrendChart :points="trend" />
    </div>

    <!-- 健康度 -->
    <div class="wm-card">
      <div class="card-title">🩺 资产健康度</div>
      <HealthRing :score="health?.score || 0" :grade="health?.grade || ''" />
      <div v-if="health" class="dim-list">
        <div v-for="d in health.dimensions" :key="d.name" class="dim-item">
          <span class="dim-name">{{ d.name }}</span>
          <span class="dim-score">{{ d.score }}</span>
          <span class="dim-comment">{{ d.comment }}</span>
        </div>
      </div>
    </div>

    <!-- AI 建议 -->
    <AdviceCard :advice="advice" />

    <!-- 财富树 -->
    <div class="wm-card">
      <div class="card-title">🌳 财富树 · 我的资产可视化</div>
      <WealthTree :overview="overview" :health-score="health?.score || 75" />
    </div>

    <div class="add-asset">
      <button class="wm-btn ghost" @click="addAsset">＋ 添加资产（导入其他渠道）</button>
    </div>
  </div>
</template>

<style scoped>
.asset-view {
  padding-bottom: 14px;
}

.entry-row {
  display: flex;
  gap: 8px;
  margin: 10px 12px 0;
}

.entry-item {
  flex: 1;
  text-align: center;
  background: #fff;
  border-radius: 13px;
  padding: 10px 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.05);
}

.entry-item:active {
  background: #fdf1f3;
  color: var(--icbc-red);
}

.asset-hero {
  background: linear-gradient(135deg, #c8102e 0%, #a00d24 70%, #8c0a1e 100%);
  color: #fff;
  padding: 20px 18px 18px;
  border-radius: 0 0 22px 22px;
}

.hero-label {
  font-size: 12px;
  opacity: 0.85;
}

.hero-value {
  font-size: 30px;
  font-weight: 800;
  margin: 4px 0 6px;
  letter-spacing: 0.5px;
}

.hero-change {
  font-size: 12px;
  font-weight: 600;
}

.hero-change .up {
  color: #ffd9a3;
}

.hero-change .down {
  color: #b8f0c8;
}

.hero-sub {
  margin-top: 6px;
  font-size: 10.5px;
  opacity: 0.7;
}

.dim-list {
  margin-top: 8px;
  border-top: 1px dashed #eef0f2;
  padding-top: 8px;
}

.dim-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  margin-bottom: 5px;
}

.dim-name {
  font-weight: 700;
  flex-shrink: 0;
}

.dim-score {
  background: #f2f3f5;
  border-radius: 999px;
  padding: 1px 8px;
  font-weight: 700;
  flex-shrink: 0;
}

.dim-comment {
  color: var(--text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-asset {
  display: flex;
  justify-content: center;
  margin-top: 6px;
}

.add-asset .wm-btn {
  font-size: 12px;
}
</style>
