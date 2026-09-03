/**
 * 夺金冒险引擎单元测试（node:test）
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  sampleReturn,
  createRun,
  advanceStep,
  tryExtract,
  tierOf,
  eligibleGear,
  GOLD_TO_CNY,
} from './adventureService.js'
import { PRODUCTS } from '../data/products.js'
import { createSeededRandom } from '../utils/random.js'

test('收益抽样：分布均值在合理范围（大样本统计）', () => {
  const etf = PRODUCTS.find((p) => p.id === 'p_etf')
  const rng = createSeededRandom(42)
  let sum = 0
  const N = 2000
  for (let i = 0; i < N; i++) sum += sampleReturn(etf, 'recovery', 0, rng)
  const avg = sum / N
  // 复苏期 ETF 月均 ≈ (8+1)/12 ≈ 0.75%，统计均值应在 ±0.3 内
  assert.ok(avg > 0.45 && avg < 1.05, `月均 ${avg.toFixed(3)}%`)
})

test('暴击与黑天鹅：噩梦难度多步必现（确定性种子）', () => {
  const run = createRun('nightmare', ['p_etf', 'p_shortbond'], 'R5')
  let cur = run
  for (let i = 0; i < 15 && cur.status === 'playing'; i++) cur = advanceStep(cur)
  assert.ok(cur.critCount + cur.swanCount > 0, `暴击${cur.critCount}/黑天鹅${cur.swanCount}`)
})

test('新手保护：前3回合黑天鹅事件被替换', () => {
  const run = createRun('easy', ['p_mmf'], 'R1')
  // 强制事件队列首项为黑天鹅
  run.eventQueue[0] = { id: 'ae_crash', type: 'blackswan', icon: '🦢', title: '股灾', desc: 'x', effect: { cycle: 'recession', productFilter: 'equity', meanShift: -5 } }
  const next = advanceStep(run)
  assert.equal(next.lastStep.event.type, 'neutral', '保护期内黑天鹅替换为平稳事件')
  assert.equal(next.swanCount, 0)
})

test('装备资格：风评门槛过滤（R3 不能装备 R4 产品）', () => {
  const gear = eligibleGear('R3')
  const stock = gear.find((p) => p.id === 'p_stock')
  assert.equal(stock.lock.type, 'risk')
  const mixed = gear.find((p) => p.id === 'p_mixed')
  assert.equal(mixed.lock, null)
})

test('撤离规则：未达标拒绝、达标结算（含现实换算与排位分）', () => {
  const run = createRun('normal', ['p_mmf'], 'R1')
  const fail = tryExtract(run)
  assert.equal(fail.ok, false)

  run.gold = run.targetGold
  const ok = tryExtract(run)
  assert.equal(ok.ok, true)
  assert.equal(ok.run.status, 'extracted')
  assert.ok(ok.run.result.profit > 0)
  assert.equal(ok.run.result.realIncomeYuan, +(ok.run.result.profit / GOLD_TO_CNY).toFixed(2))
  assert.ok(ok.run.result.rankScore > 0)
})

test('破产判定：金币清零 → busted；超时未达标 → busted', () => {
  const zero = { ...createRun('normal', ['p_mmf'], 'R1'), gold: 0 }
  const step = advanceStep(zero)
  assert.equal(step.status, 'busted')

  const timeout = { ...createRun('normal', ['p_mmf'], 'R1'), turn: 24, maxTurns: 25, gold: 1000, targetGold: 2000 }
  const step2 = advanceStep(timeout)
  assert.equal(step2.status, 'busted')
})

test('段位映射：排位分 → 青铜~王者', () => {
  assert.equal(tierOf(0).tier, 'bronze')
  assert.equal(tierOf(150).tier, 'silver')
  assert.equal(tierOf(350).tier, 'gold')
  assert.equal(tierOf(800).tier, 'platinum')
  assert.equal(tierOf(1600).tier, 'diamond')
  assert.equal(tierOf(3200).tier, 'king')
})
