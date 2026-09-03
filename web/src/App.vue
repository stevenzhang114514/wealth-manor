<script setup>
/**
 * 演示外壳：
 *   - 左侧：产品简介 + 模块导航（≥1200px 显示）
 *   - 中间：手机框（响应式缩放）
 *   - 右侧：当前模块说明 + 对应接口（≥1200px 显示）
 * 移动端自动全屏；?embed=1 强制整屏（截图/投屏用）
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PhoneFrame from './components/PhoneFrame.vue'

const route = useRoute()
const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
const isEmbed = new URLSearchParams(location.search).get('embed') === '1' || isMobile

const MODULES = {
  '/login': {
    icon: '🔐',
    title: '登录',
    desc: '手机号一键登录（演示模式任意 11 位手机号）。独立产品的身份入口。',
    apis: ['POST /api/v1/user/login'],
    points: ['手机号格式校验', '登录态本地持久化', '路由守卫保护页面'],
  },
  '/adventure': {
    icon: '🗺️',
    title: '夺金冒险（核心玩法）',
    desc: '摸金撤离局：随机事件攒金币（历史收益分布抽样 + 随机暴击 + 市场黑天鹅），达标撤离带出收益（100金币=1元现实收入），四难度排位冲击段位，收益进庄园消费。',
    apis: [
      'GET /api/v1/adventure/difficulties',
      'GET /api/v1/adventure/gear',
      'POST /api/v1/adventure/run',
      'POST /api/v1/adventure/run/:id/step',
      'POST /api/v1/adventure/run/:id/extract',
      'GET /api/v1/adventure/rank',
    ],
    points: [
      '运气×策略：继续摸金 or 落袋为安',
      '四难度（简单/普通/困难/噩梦）',
      '段位榜 + 偷菜社交',
    ],
  },
  '/simulator': {
    icon: '🧭',
    title: '生涯模式',
    desc: '回合制家庭财富经营（1回合=1个月）：产品英雄卡七维属性、风评门槛、经济周期与政策事件、目标现金流校验与财富偏差护照——深度教育模式。',
    apis: [
      'GET /api/v1/simulator/products',
      'POST /api/v1/simulator/risk-assessment',
      'POST /api/v1/simulator/session',
      'POST /api/v1/simulator/session/:id/advance',
    ],
    points: [
      '三剧本（校园/职场/家庭）',
      '事件引擎：周期×政策×生活',
      '目标倒计时 + 财富偏差护照复盘',
    ],
  },
  '/risk': {
    icon: '🛡️',
    title: '风险评估',
    desc: '10 题风评问卷模拟银行流程，结果（R1-R5）决定模拟器初始可购产品阵容。',
    apis: ['GET /api/v1/simulator/risk-assessment', 'POST /api/v1/simulator/risk-assessment'],
    points: ['10题三档评分 → R1~R5', '等级持久化，可重新评估'],
  },
  '/manor': {
    icon: '🏡',
    title: '财富庄园',
    desc: '游戏化理财首页：天气=今日行情，植物=持仓产品，生长阶段由持有期实时计算，成熟后可收获。',
    apis: ['GET /api/v1/manor/state', 'GET /api/v1/manor/weather', 'GET /api/v1/manor/plants'],
    points: ['天气与行情联动（晴/雨/彩虹）', '点击植物 → 查看持仓收益', '收获闭环 + 等级经验'],
  },
  '/assets': {
    icon: '📊',
    title: '资产看板',
    desc: '全资产一站式视图：六大类资产配置、30天净资产趋势、健康度评分、AI配置建议与财富树可视化。',
    apis: [
      'GET /api/v1/assets/overview',
      'GET /api/v1/assets/trend',
      'GET /api/v1/assets/health-score',
      'GET /api/v1/ai/portfolio-advice',
    ],
    points: ['总净资产 + 当日变动', '资产配置饼图与趋势折线', '资产体检报告（客观陈述，零建议）'],
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
  '/profile': {
    icon: '👤',
    title: '我的',
    desc: '个人中心：头像/风险等级、庄园与资产概览、理财目标入口、退出登录。',
    apis: ['GET /api/v1/user/profile'],
    points: ['用户资料与风险等级', '庄园资产概览', '退出登录清理会话'],
  },
  '/shop': {
    icon: '🛍️',
    title: '装扮商城',
    desc: '装饰/皮肤/称号三栏商品，金币钻石兑换；装备后回到庄园即可看到实景摆件。',
    apis: ['GET /api/v1/shop/items', 'POST /api/v1/shop/buy', 'POST /api/v1/shop/equip'],
    points: ['购买扣减余额，余额不足拦截', '装备装饰 → 庄园实景渲染'],
  },
  '/social': {
    icon: '👥',
    title: '好友与排行',
    desc: '好友庄园互访浇水（双方各获金币，每日1次）；月度资产配置合理性PK排行榜。',
    apis: [
      'GET /api/v1/social/friends',
      'POST /api/v1/social/visit/:id',
      'POST /api/v1/social/water/:id',
      'GET /api/v1/social/leaderboard',
    ],
    points: ['访问好友庄园快照', '浇水每日1次 + 金币入账', '本人实时插入排行榜'],
  },
  '/chat': {
    icon: '📖',
    title: 'AI金融翻译器',
    desc: '只解释金融名词（ETF/复利/存款保险/波动率等词条库），不提供任何时点性投资建议（《证券投资顾问业务暂行规定》合规）。',
    apis: ['POST /api/v1/ai/chat'],
    points: ['词条卡白话解释', '免责声明常驻', '零建议措辞'],
  },
  '/goals': {
    icon: '🎯',
    title: '目标规划',
    desc: '购房/教育/养老/应急四大场景测算器，4%年化复利公式，支持保存到我的目标。',
    apis: ['POST /api/v1/goals/plan', 'GET /api/v1/goals'],
    points: ['复利公式测算月投入', '保存目标并列表管理'],
  },
  '/import': {
    icon: '➕',
    title: '资产导入',
    desc: '四通道导入：银行自动同步、扫码、拍照OCR、手动录入；手动录入真实入账看板重算。',
    apis: ['POST /api/v1/assets/import'],
    points: ['四通道流程演示', '导入后净资产实时重算'],
  },
  '/onboarding': {
    icon: '🎮',
    title: '新手引导',
    desc: '6步概念引导 + 庄园创建（名称 + 中式/西式/日式风格），首次进入自动展示。',
    apis: ['POST /api/v1/manor/create'],
    points: ['首次进入自动触发', '创建庄园写入庄园主档'],
  },
}

const current = computed(() => MODULES[route.path] ?? MODULES['/manor'])

const tabs = Object.entries(MODULES)
  .filter(([path]) => path !== '/login' && path !== '/onboarding')
  .map(([path, m]) => ({ path, ...m }))
</script>

<template>
  <div class="demo-shell" :class="{ embed: isEmbed }">
    <aside v-if="!isEmbed" class="side-panel glass">
      <h3>¥ 个人理财系统</h3>
      <p class="sub">游戏化智能理财与个人财产管理平台 · 财富庄园引擎驱动</p>
      <div class="module-nav">
        <router-link
          v-for="t in tabs"
          :key="t.path"
          :to="t.path"
          class="module-link"
          :class="{ active: route.path === t.path }"
        >
          <span>{{ t.icon }}</span
          >{{ t.title }}
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

    <aside v-if="!isEmbed" class="side-panel glass">
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
  border-radius: var(--r-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  text-decoration: none;
  background: rgba(255, 255, 255, 0.6);
  transition: all 0.15s ease;
}

.module-link.active {
  background: var(--ios-blue);
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
  background: rgba(255, 255, 255, 0.6);
  border-radius: var(--r-md);
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

@media (max-width: 1199px) {
  .side-panel {
    display: none;
  }
}
</style>
