/**
 * 成品阶段新增纯逻辑单元测试（node:test）
 * 运行：npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { harvestRewards } from './manorService.js'
import { canAfford } from './shopService.js'
import { translateMessage } from './aiService.js'
import { annuityPayment, calcHomePlan, calcEmergency } from './goalService.js'
import { importAccount, getPortfolio } from '../providers/mock/assetProvider.js'

test('收获奖励：周期越长奖励越高（花朵 < 果树 < 林木）', () => {
  const flower = harvestRewards('sunflower') // 7天
  const tree = harvestRewards('apple') // 30天
  const oak = harvestRewards('oak') // 180天
  assert.ok(oak.coins > tree.coins && tree.coins > flower.coins)
  assert.equal(flower.coins, 40)
  assert.equal(tree.coins, 100)
  assert.equal(oak.coins, 200)
  assert.equal(oak.exp, 120)
})

test('商城余额校验：金币/钻石任一不足即不可购买', () => {
  assert.equal(canAfford({ coins: 100, diamonds: 0 }, { price: { coins: 120 } }), false)
  assert.equal(canAfford({ coins: 100, diamonds: 0 }, { price: { diamonds: 1 } }), false)
  assert.equal(canAfford({ coins: 200, diamonds: 3 }, { price: { coins: 120 } }), true)
  assert.equal(canAfford({ coins: 0, diamonds: 3 }, { price: { diamonds: 2 } }), true)
})

test('AI 金融翻译器：词条命中、未命中与合规边界', () => {
  const hit = translateMessage('什么是ETF？')
  assert.equal(hit.type, 'glossary')
  assert.equal(hit.term, 'ETF')
  assert.ok(hit.explain.includes('指数'))
  assert.ok(hit.disclaimer.includes('不构成任何投资建议'))
  // 合规断言：解释内容不含建议/买卖措辞
  assert.ok(!hit.explain.includes('建议'))
  assert.ok(!hit.explain.includes('买入'))
  assert.ok(!hit.explain.includes('卖出'))

  const none = translateMessage('今天天气怎么样呀？')
  assert.equal(none.type, 'help')
  assert.ok(none.terms.length >= 10)
  assert.ok(none.disclaimer.includes('不构成任何投资建议'))

  const empty = translateMessage('   ')
  assert.equal(empty.type, 'help')
})

test('目标测算：等额定投月供公式与购房规划数值', () => {
  // 4% 年化、60 个月、目标 90 万：月供约 1.36 万（复利摊薄）
  const monthly = annuityPayment(900000, 60)
  assert.ok(monthly > 13000 && monthly < 14500, `monthly=${monthly}`)

  const home = calcHomePlan({ price: 3000000, downPaymentPct: 30, years: 5 })
  assert.equal(home.targetAmount, 900000)
  assert.equal(home.durationMonths, 60)
  assert.ok(home.monthlyNeed > 0)
  assert.ok(home.products.length > 0)
})

test('应急储备：3~6 个月支出', () => {
  const plan = calcEmergency({ monthlyExpense: 16800 })
  assert.equal(plan.reserveMin, 50400)
  assert.equal(plan.reserveMax, 100800)
})

test('资产导入：账户追加后总览实时重算', () => {
  const before = getPortfolio()
  importAccount({ channel: '手动录入', name: '测试存款', category: '现金及存款', amount: 100000 })
  const after = getPortfolio()
  assert.equal(after.totalAssets, before.totalAssets + 100000)
  assert.equal(after.netWorth, before.netWorth + 100000)
  const cash = after.categories.find((c) => c.category === '现金及存款')
  const cashBefore = before.categories.find((c) => c.category === '现金及存款')
  assert.equal(cash.amount, cashBefore.amount + 100000)
})
