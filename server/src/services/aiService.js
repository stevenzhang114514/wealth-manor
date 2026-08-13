/**
 * AI 建议服务（演示版：规则引擎）
 *
 * 【扩展点】生产环境：接入行内AI平台 / 大模型，采用"大模型生成 + 规则引擎兜底"
 * 双引擎架构，规则引擎保证建议的可解释性与合规性。本文件的规则输出即为兜底基准。
 */
import { getProvider } from '../providers/index.js'
import { scorePortfolio } from './assetService.js'

const provider = await getProvider('asset')

/** 资产配置建议：健康度评分 + 风险预警 + 调仓建议 */
export async function getPortfolioAdvice() {
  const [portfolio, trend, cashflow] = await Promise.all([
    provider.getPortfolio(),
    provider.getTrend(30),
    provider.getCashflow(),
  ])
  const health = scorePortfolio(portfolio, trend, cashflow)

  // 金融资产口径（剔除自住房产，聚焦可配置资产）
  const liquid = portfolio.categories.filter((c) => c.category !== '不动产')
  const liquidTotal = liquid.reduce((s, c) => s + c.amount, 0)
  const ratioOf = (name) => (liquid.find((c) => c.category === name)?.amount ?? 0) / liquidTotal
  const equityRatio = ratioOf('权益类') + ratioOf('基金理财')
  const cashAmount = liquid.find((c) => c.category === '现金及存款')?.amount ?? 0

  const warnings = []
  const suggestions = []

  // 规则一：权益类集中度（股票+基金 > 50% 预警）
  if (equityRatio > 0.5) {
    warnings.push(
      `权益类资产（股票+基金）占金融资产 ${(equityRatio * 100).toFixed(1)}%，超出稳健区间（建议≤50%），市场波动时回撤可能较大`,
    )
  }
  // 规则二：单一类别 > 40% 预警（金融资产口径）
  for (const c of liquid) {
    if (c.amount / liquidTotal > 0.4) {
      warnings.push(`「${c.category}」单一类别占比 ${((c.amount / liquidTotal) * 100).toFixed(1)}% 超过40%，建议适当分散`)
    }
  }

  // 应急储备评估
  const months = cashflow.monthlyExpense > 0 ? cashAmount / cashflow.monthlyExpense : 0
  if (months >= 3) {
    suggestions.push(`应急储备充足：现金类资产约 ${(cashAmount / 10000).toFixed(1)} 万元，可覆盖约 ${months.toFixed(1)} 个月支出`)
  } else {
    warnings.push(`应急储备不足：现金类资产仅能覆盖约 ${months.toFixed(1)} 个月支出，建议保留3~6个月`)
  }

  // 保险配置评估（合理区间 10%-15%）
  const insuranceRatio = ratioOf('保险')
  if (insuranceRatio > 0.1 && insuranceRatio < 0.15) {
    suggestions.push(`保险配置占比 ${(insuranceRatio * 100).toFixed(1)}%，处于合理区间（10%~15%）`)
  }

  // 定投建议
  suggestions.push(
    `可将现金存款的20%（约 ${Math.round((cashAmount * 0.2) / 1000)} 千元）分3个月定投转入稳健理财，兼顾流动性与收益`,
  )

  const optimizePlan = [
    {
      action: '调仓',
      from: '权益类',
      to: '稳健理财',
      amount: 20000,
      reason: '降低权益集中度至50%以内',
    },
    {
      action: '定投',
      product: '稳健理财组合',
      monthly: Math.round((cashAmount * 0.2) / 3),
      reason: '平滑建仓，保留应急流动性',
    },
  ]

  return {
    healthScore: health,
    warnings,
    suggestions,
    optimizePlan,
    disclaimer: '以上建议由规则引擎生成，仅供参考，不构成投资建议。市场有风险，投资需谨慎。',
  }
}
