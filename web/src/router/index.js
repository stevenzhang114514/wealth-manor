import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由表：底部 Tab 五个主模块 + 子页面
 * 新增模块步骤：新建 views/XxxView.vue → 在此追加路由 → TabBar 追加一项
 */
const routes = [
  { path: '/', redirect: '/manor' },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { icon: '🔐', label: '登录', hideTab: true },
  },
  {
    path: '/adventure',
    name: 'adventure',
    component: () => import('../views/AdventureView.vue'),
    meta: { icon: '🗺️', label: '冒险' },
  },
  {
    path: '/simulator',
    name: 'simulator',
    component: () => import('../views/SimulatorView.vue'),
    meta: { icon: '🧭', label: '生涯模式' },
  },
  {
    path: '/risk',
    name: 'risk',
    component: () => import('../views/RiskView.vue'),
    meta: { icon: '🛡️', label: '风险评估', hideTab: true },
  },
  {
    path: '/manor',
    name: 'manor',
    component: () => import('../views/ManorView.vue'),
    meta: { icon: '🏡', label: '庄园' },
  },
  {
    path: '/assets',
    name: 'assets',
    component: () => import('../views/AssetView.vue'),
    meta: { icon: '📊', label: '资产' },
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('../views/TaskView.vue'),
    meta: { icon: '📋', label: '任务' },
  },
  {
    path: '/quiz',
    name: 'quiz',
    component: () => import('../views/QuizView.vue'),
    meta: { icon: '🎓', label: '答题' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { icon: '👤', label: '我的' },
  },
  {
    path: '/shop',
    name: 'shop',
    component: () => import('../views/ShopView.vue'),
    meta: { icon: '🛍️', label: '商城' },
  },
  {
    path: '/social',
    name: 'social',
    component: () => import('../views/SocialView.vue'),
    meta: { icon: '👥', label: '好友' },
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/ChatView.vue'),
    meta: { icon: '🤖', label: 'AI助手' },
  },
  {
    path: '/goals',
    name: 'goals',
    component: () => import('../views/GoalsView.vue'),
    meta: { icon: '🎯', label: '目标' },
  },
  {
    path: '/import',
    name: 'import',
    component: () => import('../views/ImportView.vue'),
    meta: { icon: '➕', label: '导入' },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('../views/OnboardingView.vue'),
    meta: { icon: '🎮', label: '新手引导', hideTab: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * 登录守卫（演示口径）：
 *   - 未登录访问任何页面 → /login（?skip_login=1 供截图/演示跳过）
 *   - 已登录访问 /login → /manor
 */
router.beforeEach((to) => {
  const skip = new URLSearchParams(location.search).get('skip_login') === '1'
  const logged = localStorage.getItem('wm-user')
  if (to.path !== '/login' && !logged && !skip) {
    return '/login'
  }
  if (to.path === '/login' && logged) {
    return '/manor'
  }
  return true
})

export default router
