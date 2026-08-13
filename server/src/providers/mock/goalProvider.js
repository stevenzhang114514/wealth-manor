/**
 * 理财目标域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/icbc/goalProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   getGoals()   → [{ id, goalType, label, params, plan }]（按创建时间倒序）
 *   saveGoal(goal) → 保存并返回带 id 的目标
 */
import { createSeededRandom } from '../../utils/random.js'

const rand = createSeededRandom(20260813)

/** 已保存目标（预置一条购房目标；Mock 内存态，重启重置） */
const savedGoals = [
  {
    id: 'g_001',
    goalType: 'home',
    label: '购买首套住房',
    params: { price: 3000000, downPaymentPct: 30, years: 5 },
    plan: {
      targetAmount: 900000,
      monthlyNeed: 13835,
      gap: 540000,
      suggestion: '当前每月可投入约1.1万元，与目标差距不大，建议优化支出结构并适度提高权益仓位',
      products: ['稳健理财组合', '指数基金定投'],
    },
    createdAt: '2026-08-02',
  },
]

export function getGoals() {
  return [...savedGoals].reverse()
}

export function saveGoal(goal) {
  const g = { id: `g_${Date.now()}_${Math.floor(rand() * 1000)}`, createdAt: new Date().toISOString().slice(0, 10), ...goal }
  savedGoals.push(g)
  return g
}
