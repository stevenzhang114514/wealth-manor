/**
 * 任务定义（数据驱动：新增任务只需在此追加一条 + 在 MOCK_PROGRESS 给出初始进度）
 * category: daily 日常 / weekly 周任务 / monthly 月任务 / achievement 成就
 */

export const TASK_CATEGORY_LABELS = {
  daily: '日常任务',
  weekly: '周任务',
  monthly: '月度任务',
  achievement: '成就任务',
}

export const TASK_DEFINITIONS = [
  {
    id: 't_daily_board',
    category: 'daily',
    title: '查看资产看板',
    desc: '每日查看一次资产总览',
    icon: '📊',
    target: 1,
    rewards: { coins: 10, exp: 5 },
  },
  {
    id: 't_daily_quiz',
    category: 'daily',
    title: '理财知识答题',
    desc: '完成今日5题知识问答',
    icon: '🎓',
    target: 1,
    rewards: { coins: 20, exp: 10 },
  },
  {
    id: 't_daily_visit',
    category: 'daily',
    title: '访问好友庄园',
    desc: '给好友的植物浇水1次',
    icon: '🤝',
    target: 1,
    rewards: { coins: 5, exp: 3 },
  },
  {
    id: 't_weekly_risk',
    category: 'weekly',
    title: '完成风险评估',
    desc: '本周完成一次风险测评',
    icon: '🛡️',
    target: 1,
    rewards: { coins: 50, exp: 20 },
  },
  {
    id: 't_weekly_invest',
    category: 'weekly',
    title: '定投扣款',
    desc: '本周完成一次基金定投',
    icon: '📅',
    target: 1,
    rewards: { coins: 30, exp: 15 },
  },
  {
    id: 't_monthly_diversify',
    category: 'monthly',
    title: '资产配置多样化',
    desc: '资产类别达到3类以上',
    icon: '🧺',
    target: 3,
    rewards: { coins: 80, exp: 30, seed: 'rare' },
  },
  {
    id: 't_achieve_invest3m',
    category: 'achievement',
    title: '连续定投3个月',
    desc: '连续3个月完成定投',
    icon: '🏆',
    target: 3,
    rewards: { coins: 200, exp: 50, diamond: 1 },
  },
  {
    id: 't_achieve_knowledge',
    category: 'achievement',
    title: '理财知识达人',
    desc: '累计答对50题',
    icon: '📚',
    target: 50,
    rewards: { coins: 150, exp: 40 },
  },
]

/** 演示用户的初始任务进度（Mock：真实环境由任务引擎维护） */
export const MOCK_PROGRESS = {
  t_daily_board: { progress: 1, claimed: false },
  t_daily_quiz: { progress: 1, claimed: false },
  t_daily_visit: { progress: 0, claimed: false },
  t_weekly_risk: { progress: 1, claimed: false },
  t_weekly_invest: { progress: 0, claimed: false },
  t_monthly_diversify: { progress: 4, claimed: false },
  t_achieve_invest3m: { progress: 2, claimed: false },
  t_achieve_knowledge: { progress: 23, claimed: false },
}
