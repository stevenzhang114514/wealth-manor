<script setup>
/**
 * 底部导航（5 Tab）：庄园 / 资产 / 任务 / 答题 / 我的
 * iOS 风格：毛玻璃半透明背景 + 安全区
 */
import { useRoute, useRouter } from 'vue-router'
import { useManorStore } from '../stores/manor.js'

const route = useRoute()
const router = useRouter()
const manor = useManorStore()

const tabs = [
  { path: '/manor', icon: '🏡', label: '庄园' },
  { path: '/assets', icon: '📊', label: '资产' },
  { path: '/tasks', icon: '📋', label: '任务' },
  { path: '/quiz', icon: '🎓', label: '答题' },
  { path: '/profile', icon: '👤', label: '我的' },
]

const go = (path) => router.push(path)
</script>

<template>
  <nav class="tab-bar">
    <button
      v-for="t in tabs"
      :key="t.path"
      class="tab-item"
      :class="{ active: route.path === t.path }"
      @click="go(t.path)"
    >
      <span class="tab-icon">{{ t.icon }}</span>
      <span class="tab-label">{{ t.label }}</span>
    </button>
    <span v-if="manor.state" class="tab-coins" title="庄园金币">🪙 {{ manor.coins }}</span>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: relative;
  flex-shrink: 0;
  height: 58px;
  display: flex;
  background: rgba(249, 249, 249, 0.82);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.2);
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  color: var(--text-sub);
  transition: color 0.15s ease;
}

.tab-icon {
  font-size: 19px;
  line-height: 1;
}

.tab-label {
  font-size: 10px;
  font-weight: 600;
}

.tab-item.active {
  color: var(--ios-blue);
}

.tab-coins {
  position: absolute;
  top: -11px;
  right: 14px;
  background: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 0.5px solid rgba(60, 60, 67, 0.15);
  color: #8a6d1f;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
