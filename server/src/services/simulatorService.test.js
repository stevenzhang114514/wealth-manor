/**
 * 财富人生模拟器引擎单元测试（node:test）
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  scoreRiskAssessment,
  mapAnswersToScores,
  eligibleProducts,
  monthlyReturn,
  createSession,
  advanceTurn,
  liquidAssets,
  buildPassport,
} from './simulatorService.js'
import { SCENARIOS } from '../data/scenarios.js'

test('风评映射：满分=进取型R5，低分=保守型R1', () => {
  assert.equal(scoreRiskAssessment([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]).level, 'R5')
  assert.equal(scoreRiskAssessment([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]).level, 'R1')
  assert.equal(scoreRiskAssessment([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]).level, 'R3')
})

test('答案映射：10题答案转为分数序列', () => {
  const answers = Array.from({ length: 10 }, (_, i) => ({ id: `q${i + 1}`, option: 2 }))
  const scores = mapAnswersToScores(answers)
  assert.equal(scores.length, 10)
  assert.ok(scores.every((s) => s > 0))
})

test('产品资格：风评不足与资金不足双门槛', () => {
  const list = eligibleProducts('R1', 5000)
  const stock = list.find((p) => p.id === 'p_stock')
  assert.equal(stock.lock.type, 'risk') // R4 产品对 R1 用户锁定
  const cd = list.find((p) => p.id === 'p_cd')
  assert.equal(cd.lock.type, 'money') // 20万起投，5000 现金不够
  const mmf = list.find((p) => p.id === 'p_mmf')
  assert.equal(mmf.lock, null)
})

test('收益率状态机：衰退期股票大跌、国债走强', () => {
  const stock = eligibleProducts('R5', 0).find((p) => p.id === 'p_stock')
  const tbond = eligibleProducts('R5', 0).find((p) => p.id === 'p_tbond')
  const boom = monthlyReturn(stock, { cycle: 'expansion', fx: null })
  const bust = monthlyReturn(stock, { cycle: 'recession', fx: null })
  assert.ok(boom > bust, `扩张期 ${boom} 应高于衰退期 ${bust}`)
  const tbondBust = monthlyReturn(tbond, { cycle: 'recession', fx: null })
  assert.ok(tbondBust > 0, '衰退期国债收益为正')
})

test('政策修正：降息利好债基、利空存款', () => {
  const demand = eligibleProducts('R5', 0).find((p) => p.id === 'p_demand')
  const shortbond = eligibleProducts('R5', 0).find((p) => p.id === 'p_shortbond')
  const fx = { rate: -0.4, bond: 0.7 }
  const d0 = monthlyReturn(demand, { cycle: 'recovery', fx: null })
  const d1 = monthlyReturn(demand, { cycle: 'recovery', fx })
  const b0 = monthlyReturn(shortbond, { cycle: 'recovery', fx: null })
  const b1 = monthlyReturn(shortbond, { cycle: 'recovery', fx })
  assert.ok(d1 < d0, '降息后存款收益下降')
  assert.ok(b1 > b0, '降息后短债基金收益上升')
})

test('会话创建：初始状态与确定性事件队列', () => {
  const s1 = createSession(SCENARIOS[1], 'R3')
  const s2 = createSession(SCENARIOS[1], 'R3')
  assert.equal(s1.eventQueue[0].id, s2.eventQueue[0].id) // 种子固定，队列一致
  assert.equal(s1.totalTurns, 60)
  assert.equal(s1.cash, 20000)
  assert.equal(s1.goals.length, 2)
})

test('回合推进：发薪、支出、事件与现金变化', () => {
  const s = createSession(SCENARIOS[0], 'R3')
  const before = s.cash
  const next = advanceTurn(s, {})
  assert.equal(next.turn, 1)
  assert.equal(next.cash, before + 3000 - 2200 + (next.lastEvent.effects.cash ?? 0))
  assert.ok(next.lastEvent, '每回合有事件')
  assert.equal(next.age, 21)
})

test('购买与收益结算：持仓复利增长', () => {
  const s = createSession(SCENARIOS[1], 'R3')
  const next = advanceTurn(s, { buys: [{ productId: 'p_fixed1y', amount: 10000 }] })
  assert.equal(next.cash, s.cash + 2500 - 10000)
  assert.equal(next.holdings.length, 1)
  const after = advanceTurn(next, {})
  assert.ok(after.holdings[0].amount > 10000, '定期存款按月计息复利')
})

test('锁定产品提前赎回：按活期计息（收益低于正常持有）', () => {
  const s = createSession(SCENARIOS[1], 'R3')
  let cur = advanceTurn(s, { buys: [{ productId: 'p_fixed1y', amount: 10000 }] })
  cur = advanceTurn(cur, {})
  const beforeCash = cur.cash
  const next = advanceTurn(cur, { redeems: [{ index: 0, amount: 10050 }] })
  assert.equal(next.holdings.length, 0)
  // 赎回到账 ≈ 本金×(1+活期息×2月) ≈ 10003，显著低于正常持有收益
  const redeemValue = next.cash - beforeCash - (cur.income - cur.expense) - (next.lastEvent.effects.cash ?? 0)
  assert.ok(redeemValue < 10050 && redeemValue > 9990, `赎回到账 ${redeemValue} 应接近本金（活期计息）`)
  assert.ok(next.log.some((l) => l.text.includes('提前赎回')), '日志记录提前赎回警告')
})

test('封闭期产品不可赎回', () => {
  const s = createSession(SCENARIOS[1], 'R3')
  let cur = advanceTurn(s, { buys: [{ productId: 'p_wm2', amount: 5000 }] })
  const cashBefore = cur.cash
  cur = advanceTurn(cur, { redeems: [{ index: 0, amount: 5000 }] })
  assert.equal(cur.holdings.length, 1, '封闭期内赎回被拒绝')
  assert.equal(cur.cash, cashBefore + 2500 - 0 + 0, '现金仅受发薪影响（无赎回）')
})

test('流动性危机：现金断流触发失败结局', () => {
  const s = createSession(SCENARIOS[0], 'R3')
  let cur = { ...s, cash: 100, expense: 2200, income: 3000 }
  cur = advanceTurn({ ...s, cash: 0, income: 0 }, {})
  // 月入0且现金0 → 支出后现金为负
  assert.ok(cur.gameOver === 'liquidity' || cur.cash < 0, '断流触发流动性危机')
})

test('目标达成与护照：长期经营可产生复盘数据', () => {
  const s = createSession(SCENARIOS[1], 'R3') // 职场剧本：60回合，现金缓冲更足
  let cur = s
  // 每回合保留 1.2 万现金缓冲，稳步买入定期存款，经营到终局
  for (let i = 0; i < 61 && !cur.gameOver; i++) {
    const budget = Math.min(1000, Math.max(0, cur.cash - 12000))
    cur = advanceTurn(cur, budget > 0 ? { buys: [{ productId: 'p_fixed1y', amount: budget }] } : {})
  }
  assert.ok(['complete', 'liquidity'].includes(cur.gameOver), `终局状态 ${cur.gameOver}`)
  const passport = buildPassport(cur)
  assert.equal(passport.dims.length, 4)
  assert.ok(passport.grade)
  assert.equal(typeof liquidAssets(cur), 'number')
  assert.ok(cur.log.length > 50, `回合日志完整 ${cur.log.length}`)
})
