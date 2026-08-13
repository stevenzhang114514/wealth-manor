<script setup>
/**
 * 桌面演示外壳：
 *   - 左侧：项目简介 + 创新点 + 模块导航
 *   - 中间：手机框（375×812）
 *   - 右侧：当前模块说明 + 对应接口
 * 加 ?embed=1 进入整屏嵌入模式（截图/投屏演示用）
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PhoneFrame from './components/PhoneFrame.vue'

const route = useRoute()
const isEmbed = new URLSearchParams(location.search).get('embed') === '1'

const MODULES = {
  '/manor': {
    icon: '🏡',
    title: '庄园主页',
    desc: '游戏化理财核心场景：天气=今日行情，植物=持仓产品，生长阶段由持有期实时计算，点击植物查看关联理财产品的收益。',
    apis: ['GET /api/v1/manor/state', 'GET /api/v1/manor/weather', 'GET /api/v1/manor/plants'],
    points: ['天气与行情联动（晴/雨/彩虹）', '点击植物 → 查看持仓收益', '等级经验与任务联动'],
  },
  '/assets': {
    icon: '📊',
    title: '资产看板',
    desc: '全资产一站式视图：六大类资产配置、30天净资产趋势、健康度评分、AI配置建议与财富树可视化。',
    apis: ['GET /api/v1/assets/overview', 'GET /api/v1/assets/trend', 'GET /api/v1/assets/health-score', 'GET /api/v1/ai/portfolio-advice'],
    points: ['总净资产 + 当日变动', '资产配置饼图与趋势折线', 'AI建议 → 一键优化（演示）'],
  },
  '/tasks': {
    icon: '📋',
    title: '任务中心',
    desc: '日常/周/月/成就四类任务引导理财行为，领取奖励金币经验实时入账（写入庄园主档）。',
    apis: ['GET /api/v1/manor/tasks', 'POST /api/v1/manor/tasks/:id/claim'],
    points: ['点击"领取" → 奖励实时入账', '三类状态：进行中/可领取/已领取'],
  },
  '/quiz': {
    icon: '🎓',
    title: '知识答题',
    desc: '每日5题理财知识问答，提交即时判分，答对得金币经验，满分获徽章碎片。',
    apis: ['GET /api/v1/quiz/questions?n=5', 'POST /api/v1/quiz/submit'],
    points: ['5题随机抽取自题库', '即时判分 + 解析展示'],
  },
}

const current = computed(() => MODULES[route.path] ?? MODULES['/manor'])

const tabs = Object.entries(MODULES).map(([path, m]) => ({ path, ...m }))
</script>

<template>
  <div class="demo-shell" :class="{ embed: isEmbed }">
    <aside v-if="!isEmbed" class="side-panel">
      <h3>🏡 财富庄园 · Wealth Manor</h3>
      <p class="sub">工行APP游戏化智能理财 &amp; 个人财产管理平台（演示原型）</p>
      <div class="module-nav">
        <router-link
          v-for="t in tabs"
          :key="t.path"
          :to="t.path"
          class="module-link"
          :class="{ active: route.path === t.path }"
        >
          <span>{{ t.icon }}</span>{{ t.title }}
        </router-link>
      </div>
      <div class="side-tags">
        <span class="wm-chip">游戏化理财</span>
        <span class="wm-chip">全资产看板</span>
        <span class="wm-chip">AI配置建议</span>
        <span class="wm-chip">财富树</span>
      </div>
    </aside>

    <PhoneFrame />

    <aside v-if="!isEmbed" class="side-panel">
      <h3>{{ current.icon }} {{ current.title }}</h3>
      <p class="sub">{{ current.desc }}</p>
      <div class="point-list">
        <div v-for="p in current.points" :key="p" class="point">▸ {{ p }}</div>
      </div>
      <div class="api-box">
        <div class="api-title">本页接口</div>
        <code v-for="a in current.apis" :key="a" class="api-line">{{ a }}</code>
      </div>
      <div class="side-tags">
        <span class="wm-chip">Vue 3</span>
        <span class="wm-chip">Express</span>
        <span class="wm-chip">ECharts</span>
        <span class="wm-chip">RESTful</span>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.module-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.module-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  text-decoration: none;
  background: #f4f6f8;
  transition: all 0.15s ease;
}

.module-link.active {
  background: var(--icbc-red);
  color: #fff;
}

.side-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.point-list {
  font-size: 12px;
  line-height: 1.9;
  color: #4b5563;
  margin-bottom: 14px;
}

.api-box {
  background: #f7f8fa;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.api-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-sub);
  margin-bottom: 6px;
}

.api-line {
  display: block;
  font-size: 10.5px;
  color: #5d6672;
  line-height: 1.9;
  word-break: break-all;
}

@media (max-width: 1100px) {
  .side-panel {
    display: none;
  }
}
</style>
