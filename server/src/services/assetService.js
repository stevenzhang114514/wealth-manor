/**
 * 资产服务（业务逻辑层）
 * 只依赖 provider 注册表获取数据，不关心数据来源（Mock / 真实工行接口）。
 */
import { getProvider } from '../providers/index.js'

const provider = await getProvider('asset')

/** 资产总览：当前时点快照 + 大类占比 */
export async function getOverview() {
  return provider.getPortfolio()
}

/** 账户明细列表（看板下钻） */
export async function getAccounts() {
  return provider.getAccounts()
}

/** 近 N 天净资产趋势（默认30天，支持 30/90/365） */
export async function getTrend(days = 30) {
  const safeDays = [30, 90, 365].includes(Number(days)) ? Number(days) : 30
  return provider.getTrend(safeDays)
}

/**
 * 资产健康度评分（纯函数，便于单元测试）
 * 三维度加权：
 *   流动性 30% —— 现金类资产覆盖月支出的月数（≥5个月为满分）
 *   安全性 40% —— 权益类集中度与负债率扣分
 *   收益性 30% —— 近30日净资产收益率（对数标度）
 */
export function scorePortfolio(portfolio, trend, cashflow) {
  const liquid = portfolio.categories.filter((c) => c.category !== '不动产')
  const liquidTotal = liquid.reduce((s, c) => s + c.amount, 0)
  const cash = liquid.find((c) => c.category === '现金及存款')?.amount ?? 0
  const equity = liquid
    .filter((c) => ['权益类', '基金理财'].includes(c.category))
    .reduce((s, c) => s + c.amount, 0)

  const months = cashflow.monthlyExpense > 0 ? cash / cashflow.monthlyExpense : 0
  const liquidity = clamp((months / 5) * 100, 0, 100)

  const equityRatio = liquidTotal > 0 ? equity / liquidTotal : 0
  const debtRatio = portfolio.totalAssets > 0 ? portfolio.totalLiabilities / portfolio.totalAssets : 0
  const safety = clamp(
    100 - Math.max(0, equityRatio - 0.5) * 200 - Math.max(0, debtRatio - 0.5) * 100,
    0,
    100,
  )

  const first = trend[0]?.netWorth ?? 0
  const last = trend[trend.length - 1]?.netWorth ?? 0
  const monthlyReturnPct = first > 0 ? ((last - first) / first) * 100 : 0
  const profitability = clamp(50 + Math.log2(1 + Math.max(0, monthlyReturnPct)) * 20, 0, 100)

  const score = Math.round(liquidity * 0.3 + safety * 0.4 + profitability * 0.3)
  const grade = score >= 90 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '一般' : '需关注'

  return {
    score,
    grade,
    dimensions: [
      { name: '流动性', score: Math.round(liquidity), comment: `现金类资产约覆盖 ${months.toFixed(1)} 个月支出` },
      { name: '安全性', score: Math.round(safety), comment: `权益类占比 ${(equityRatio * 100).toFixed(1)}%，负债率 ${(debtRatio * 100).toFixed(1)}%` },
      { name: '收益性', score: Math.round(profitability), comment: `近30日净资产收益率 ${monthlyReturnPct.toFixed(2)}%` },
    ],
  }
}

/** 健康度评分接口（含趋势与现金流数据） */
export async function getHealthScore() {
  const [portfolio, trend, cashflow] = await Promise.all([
    provider.getPortfolio(),
    provider.getTrend(30),
    provider.getCashflow(),
  ])
  return scorePortfolio(portfolio, trend, cashflow)
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}
