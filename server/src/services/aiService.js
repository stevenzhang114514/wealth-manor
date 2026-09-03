/**
 * AI 服务（合规版）
 * 依据《证券投资顾问业务暂行规定》：不提供任何时点性投资建议。
 * 本模块只做两件事：
 *   1. 金融翻译器：名词解释（data/glossary.js 词条库）
 *   2. 资产体检报告：客观陈述事实 + 历史规律性风险提示（零建议措辞）
 */
import { getProvider } from '../providers/index.js'
import { scorePortfolio } from './assetService.js'
import { GLOSSARY, GLOSSARY_DISCLAIMER } from '../data/glossary.js'

const provider = await getProvider('asset')

/**
 * 金融翻译器（纯函数）：关键词命中词条 → 概念解释 + 免责声明
 * 未命中 → 返回可解释的词条列表引导
 */
export function translateMessage(message) {
  const text = String(message ?? '').trim()
  const hit = text && GLOSSARY.find((g) => g.keywords.some((k) => text.includes(k)))
  if (hit) {
    return {
      type: 'glossary',
      term: hit.term,
      explain: hit.explain,
      disclaimer: GLOSSARY_DISCLAIMER,
      terms: GLOSSARY.map((g) => g.term),
    }
  }
  return {
    type: 'help',
    explain: `我是金融翻译器，可以帮你解释这些概念：${GLOSSARY.map((g) => g.term).join('、')}。`,
    disclaimer: GLOSSARY_DISCLAIMER,
    terms: GLOSSARY.map((g) => g.term),
  }
}

export async function chat(message) {
  return translateMessage(message)
}

/**
 * 资产体检报告：只陈述事实，不提供调仓建议。
 * facts：资产结构客观数据；riskNotes：历史规律性风险提示（教育性陈述）
 */
export async function getPortfolioReport() {
  const [portfolio, trend, cashflow] = await Promise.all([
    provider.getPortfolio(),
    provider.getTrend(30),
    provider.getCashflow(),
  ])
  const health = scorePortfolio(portfolio, trend, cashflow)

  // 金融资产口径（剔除自住房产）
  const liquid = portfolio.categories.filter((c) => c.category !== '不动产')
  const liquidTotal = liquid.reduce((s, c) => s + c.amount, 0)
  const pct = (name) => Math.round((liquid.find((c) => c.category === name)?.amount ?? 0) / liquidTotal * 1000) / 10
  const equityRatio = pct('权益类') + pct('基金理财')
  const cashAmount = liquid.find((c) => c.category === '现金及存款')?.amount ?? 0
  const cashMonths = cashflow.monthlyExpense > 0 ? +(cashAmount / cashflow.monthlyExpense).toFixed(1) : 0
  const maxCat = [...liquid].sort((a, b) => b.amount - a.amount)[0]

  const facts = [
    `金融资产中「基金理财」占比 ${pct('基金理财')}%，「权益类」占比 ${pct('权益类')}%，合计 ${equityRatio}%`,
    `单一类别最高占比为「${maxCat.category}」${+(maxCat.amount / liquidTotal * 100).toFixed(1)}%`,
    `现金类资产约 ${cashMonths} 万元，可覆盖约 ${cashMonths === Math.round(cashMonths) ? cashMonths : cashMonths} 个月支出`,
    `保险类资产占金融资产的 ${pct('保险')}%`,
    `近30日净资产收益率 ${+(portfolio.todayChangePct * 100).toFixed(2)}%（当日变动，不代表长期）`,
  ]

  const riskNotes = []
  if (equityRatio > 50) {
    riskNotes.push('历史上，权益类占比较高的组合在市场下行阶段的净值波动通常更大（客观规律陈述）')
  }
  if (maxCat.amount / liquidTotal > 0.4) {
    riskNotes.push(`「${maxCat.category}」单一类别占比超过40%，此类组合受该类别资产波动的影响更深（客观规律陈述）`)
  }
  if (cashMonths < 3) {
    riskNotes.push('现金类资产不足3个月支出，历史上此类家庭在突发事件中更容易被迫中断长期安排（客观规律陈述）')
  }
  if (!riskNotes.length) {
    riskNotes.push('当前资产结构未触发常见风险提示条件')
  }

  return {
    healthScore: health,
    facts,
    riskNotes,
    disclaimer: '本报告仅客观陈述您的资产结构事实与历史规律，不构成任何投资建议。市场有风险，决策请独立判断。',
  }
}
