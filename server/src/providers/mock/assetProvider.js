/**
 * 资产域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/prod/assetProvider.js 时，
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

/** 账户明细（Mock 内存态：导入的账户实时追加，重启重置） */
const accounts = [...ACCOUNTS]

/**
 * 资产总览：基础分类 + 导入账户按分类汇总实时重算
 * 注：todayChange/todayChangePct 保持静态（模拟行情），导入不改变当日盈亏与庄园天气
 */
export function getPortfolio() {
  const importedByCat = new Map()
  let importedTotal = 0
  for (const a of accounts) {
    if (!a.imported) continue
    importedByCat.set(a.category, (importedByCat.get(a.category) ?? 0) + a.balance)
    importedTotal += a.balance
  }
  const total = PORTFOLIO.totalAssets + importedTotal
  const categories = PORTFOLIO.categories.map((c) => {
    const amount = c.amount + (importedByCat.get(c.category) ?? 0)
    return { ...c, amount, ratio: +(amount / total).toFixed(4) }
  })
  return {
    ...PORTFOLIO,
    totalAssets: total,
    netWorth: PORTFOLIO.netWorth + importedTotal,
    categories,
    liabilities: LIABILITIES,
  }
}

export function getAccounts() {
  return accounts.map((a) => ({ ...a }))
}

/** 资产导入：追加账户（渠道：自动同步/扫码导入/OCR识别/手动录入） */
export function importAccount({ channel, name, category, amount, institution = '外部渠道' }) {
  const account = {
    id: `a_imp_${Date.now()}`,
    name,
    category,
    institution,
    balance: amount,
    currency: 'CNY',
    syncType: channel,
    imported: true,
  }
  accounts.push(account)
  return { ...account }
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
