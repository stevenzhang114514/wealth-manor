<script setup>
/**
 * 我的（个人中心）：头像卡 / 庄园 / 资产概览 / 功能入口 / 退出登录
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserProfile } from '../api/user.js'
import { useManorStore } from '../stores/manor.js'
import { formatMoney } from '../utils/format.js'
import { toast } from '../utils/toast.js'

const router = useRouter()
const manor = useManorStore()
const user = ref(null)

onMounted(async () => {
  try {
    user.value = JSON.parse(localStorage.getItem('wm-user') || 'null') || (await getUserProfile())
  } catch {
    user.value = null
  }
  if (!manor.state) await manor.refresh()
})

const displayName = computed(() => user.value?.name ?? '庄园主')

const logout = () => {
  localStorage.removeItem('wm-user')
  localStorage.removeItem('wm-onboarded')
  toast('已退出登录')
  router.push('/login')
}

const about = () => toast('个人理财系统 v2.0.0 · Apple 风格演示版\n财富庄园游戏化理财引擎驱动')
</script>

<template>
  <div class="profile-view">
    <!-- 头像卡 -->
    <div class="profile-hero">
      <div class="p-avatar">{{ user?.avatar || '🧑‍🌾' }}</div>
      <div class="p-info">
        <div class="p-name">{{ displayName }}</div>
        <div class="p-phone">
          {{ user?.phone || '138****6688' }} · 入驻 {{ user?.signupDays || 366 }} 天
        </div>
      </div>
      <div class="p-risk">
        <span class="wm-chip">{{ user?.riskLevel || 'R3' }}</span>
        <span class="risk-label">{{ user?.riskLevelName || '稳健型' }}</span>
      </div>
    </div>

    <!-- 庄园卡 -->
    <div class="wm-card manor-mini">
      <div class="card-title">🏡 我的庄园</div>
      <div class="manor-line">
        <span class="mm-name">{{ manor.state?.name || '明曦庄园' }}</span>
        <span class="wm-chip">{{ manor.state?.style || '中式' }}庄园</span>
        <span class="mm-level"
          >Lv.{{ manor.state?.level ?? 8 }} · {{ manor.state?.stageName || '精致田园' }}</span
        >
      </div>
      <div class="manor-line sub">
        <span>🪙 {{ manor.coins }} 金币</span>
        <span>💎 {{ manor.state?.diamonds ?? 0 }} 钻石</span>
        <span>🏅 {{ manor.state?.honorPoints ?? 0 }} 荣誉点</span>
      </div>
    </div>

    <!-- 资产概览 -->
    <div class="wm-card">
      <div class="card-title">💰 资产概览</div>
      <div class="asset-row">
        <div class="ar-item">
          <div class="ar-num">{{ formatMoney(user?.netWorth ?? 1155800) }}</div>
          <div class="ar-label">总净资产</div>
        </div>
        <div class="ar-item">
          <div class="ar-num">{{ formatMoney(user?.totalAssets ?? 1535800) }}</div>
          <div class="ar-label">总资产</div>
        </div>
        <div class="ar-item">
          <div class="ar-num">4</div>
          <div class="ar-label">资产类别</div>
        </div>
      </div>
    </div>

    <!-- 功能入口（iOS 列表） -->
    <div class="ios-list">
      <button class="ios-list-item" @click="router.push('/goals')">
        <span>🎯</span> 我的理财目标 <span class="chevron">›</span>
      </button>
      <button class="ios-list-item" @click="router.push('/onboarding')">
        <span>🎮</span> 新手引导（重玩） <span class="chevron">›</span>
      </button>
      <button class="ios-list-item" @click="router.push('/chat')">
        <span>🤖</span> AI理财助手·小满 <span class="chevron">›</span>
      </button>
      <button class="ios-list-item" @click="about">
        <span>ℹ️</span> 关于个人理财系统 <span class="chevron">›</span>
      </button>
    </div>

    <!-- 退出登录 -->
    <div class="ios-list">
      <button class="ios-list-item danger" @click="logout">退出登录</button>
    </div>

    <div class="profile-foot">个人理财系统 v2.0.0 · 演示环境数据仅供展示</div>
  </div>
</template>

<style scoped>
.profile-view {
  padding-bottom: 14px;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #eef4ff, #f7faff);
  border-radius: 0 0 var(--r-xl) var(--r-xl);
  padding: 22px 18px 26px;
}

.p-avatar {
  width: 62px;
  height: 62px;
  border-radius: 20px;
  background: #fff;
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.p-info {
  flex: 1;
}

.p-name {
  font-size: 18px;
  font-weight: 800;
}

.p-phone {
  font-size: 11px;
  color: var(--text-sub);
  margin-top: 3px;
}

.p-risk {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.risk-label {
  font-size: 10px;
  color: var(--text-sub);
}

.manor-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
}

.manor-line.sub {
  margin-top: 8px;
  color: var(--text-sub);
  font-size: 11.5px;
}

.mm-name {
  font-weight: 800;
}

.mm-level {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-sub);
}

.asset-row {
  display: flex;
}

.ar-item {
  flex: 1;
  text-align: center;
}

.ar-item + .ar-item {
  border-left: 0.5px solid var(--separator);
}

.ar-num {
  font-size: 14px;
  font-weight: 800;
}

.ar-label {
  font-size: 10px;
  color: var(--text-sub);
  margin-top: 3px;
}

.chevron {
  margin-left: auto;
  color: var(--text-tert);
  font-size: 16px;
}

.ios-list-item.danger {
  color: var(--ios-red);
  justify-content: center;
  font-weight: 600;
}

.profile-foot {
  text-align: center;
  font-size: 9.5px;
  color: var(--text-tert);
  margin-top: 10px;
}
</style>
