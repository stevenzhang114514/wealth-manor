import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由表：底部 Tab 四个模块
 * 新增模块步骤：新建 views/XxxView.vue → 在此追加路由 → TabBar 追加一项
 */
const routes = [
  { path: '/', redirect: '/manor' },
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
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
