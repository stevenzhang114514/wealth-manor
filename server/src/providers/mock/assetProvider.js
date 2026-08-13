/**
 * 资产域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/icbc/assetProvider.js 时，
 * 必须导出与本文件完全一致的函数签名与返回结构：
 *   getPortfolio()      → { totalAssets, totalLiabilities, netWorth, todayChange,
 *                           todayChangePct, categories: [{category, icon, color, amount, ratio}],
 *                           liabilities: [...] }
 *   getAccounts()       → [{ id, name, category, institution, balance, currency, syncType }]
 *   getTrend(days)      → [{ date, netWorth, dailyChange }] 按日期升序
 *   getCashflow()       → { monthlyIncome, monthlyExpense, breakdown: [{item, amount}] }
 */
import { ACCOUNTS, LIABILITIES, PORTFOLIO, CASHFLOW } from '../../data/assets.js'
import { createSeededRandom } from '../../utils/random.js'

export function getPortfolio() {
  const total = PORTFOLIO.totalAssets
  const categories = PORTFOLIO.categories.map((c) => ({
    ...c,
    ratio: +(c.amount / total).toFixed(4),
  }))
  return {
    ...PORTFOLIO,
    categories,
    liabilities: LIABILITIES,
  }
}

export function getAccounts() {
  return ACCOUNTS
}

/**
 * 近 N 天净资产趋势（确定性随机游走，向当前净资产收敛）
 * 种子固定 → 每次启动曲线一致，便于演示与回归测试
 */
export function getTrend(days = 30) {
  const rand = createSeededRandom(20260813)
  const endValue = PORTFOLIO.netWorth
  const startValue = 1117000

  // 首先生成 0..days 的价值序列（含首尾两天）
  const values = []
  for (let i = 0; i <= days; i++) {
    if (i === days) {
      values.push(endValue)
      break
    }
    const progress = i / days
    const base = startValue + (endValue - startValue) * progress
    const noise = (rand() - 0.48) * 0.006 * base
    values.push(base + noise)
  }

  const points = []
  const today = new Date()
  for (let i = 0; i <= days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - i))
    const netWorth = Math.round(values[i])
    points.push({
      date: d.toISOString().slice(0, 10),
      netWorth,
      dailyChange: i === 0 ? 0 : Math.round(values[i] - values[i - 1]),
    })
  }
  return points
}

export function getCashflow() {
  return CASHFLOW
}
