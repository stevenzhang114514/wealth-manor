/**
 * 夺金冒险引擎 v2（摸金开箱）单元测试（node:test）
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  rollQuality,
  upgradeQuality,
  sectorMood,
  eligibleContainers,
  createRun,
  advanceStep,
  tryExtract,
  tierOf,
  GOLD_TO_CNY,
  QUALITIES,
  SECTORS,
} from './adventureService.js'
import { createSeededRandom } from '../utils/random.js'

test('品质掉落：大样本频率接近配置概率', () => {
  const rng = createSeededRandom(7)
  const counts = {}
  const N = 20000
  for (let i = 0; i < N; i++) {
    const q = rollQuality(rng)
    counts[q.id] = (counts[q.id] ?? 0) + 1
  }
  for (const q of QUALITIES) {
    const freq = (counts[q.id] ?? 0) / N
    assert.ok(Math.abs(freq - q.probability) < 0.015, `${q.id} 频率 ${freq} vs 配置 ${q.probability}`)
  }
})

test('品质升级：逐档提升、传说封顶', () => {
  assert.equal(upgradeQuality({ id: 'common' }).id, 'fine')
  assert.equal(upgradeQuality({ id: 'rare' }).id, 'epic')
  assert.equal(upgradeQuality({ id: 'legend' }).id, 'legend')
})

test('板块景气度：区间与标签', () => {
  const rng = createSeededRandom(3)
  for (const s of SECTORS) {
    const mood = sectorMood(s, 'recession', rng)
    assert.ok(mood.factor > -3.5 && mood.factor < 3.5)
    assert.ok(['景气', '平稳', '低迷'].includes(mood.label))
  }
})

test('容器资格：风评门槛（R1 仅债券）', () => {
  const r1 = eligibleContainers('R1')
  assert.equal(r1.find((c) => c.id === 'bond').lock, null)
  assert.equal(r1.find((c) => c.id === 'stock').lock.type, 'risk')
  const r3 = eligibleContainers('R3')
  assert.ok(r3.every((c) => c.lock === null))
})

test('创建一局：双容器装备与风评过滤', () => {
  const run = createRun('normal', ['stock', 'bond'], 'R1')
  assert.deepEqual(run.containers, ['bond'], 'R1 用户被过滤掉股票容器')
  assert.equal(run.currentContainer, 'bond')
  const run2 = createRun('normal', ['stock', 'fund'], 'R3')
  assert.equal(run2.containers.length, 2)
})

test('开箱一步：字段完整、副收益范围、金币变化', () => {
  const run = createRun('easy', ['stock', 'fund'], 'R3')
  const next = advanceStep(run)
  const s = next.lastStep
  assert.ok(s.sector && s.mood && s.container && s.quality && s.loot, '开箱结果字段完整')
  assert.ok(s.value !== 0)
  if (s.sideIncome > 0) {
    assert.ok(s.sideIncome >= 5 && s.sideIncome <= 50, '副收益在配置区间')
  }
  if (s.upgraded) {
    assert.ok(s.quality.multiplier >= 2, '升级后品质至少良品')
  }
  assert.equal(next.turn, 1)
  assert.equal(next.gold, run.gold + s.value + s.sideIncome)
})

test('容器切换：step 指定 containerId 生效', () => {
  const run = createRun('easy', ['stock', 'bond'], 'R3')
  const next = advanceStep(run, { containerId: 'bond' })
  assert.equal(next.currentContainer, 'bond')
  assert.equal(next.lastStep.container.id, 'bond')
})

test('暴击与黑天鹅：噩梦难度多步必现（确定性种子）', () => {
  const run = createRun('nightmare', ['stock', 'fund'], 'R5')
  let cur = run
  for (let i = 0; i < 15 && cur.status === 'playing'; i++) cur = advanceStep(cur)
  assert.ok(cur.critCount + cur.swanCount > 0, `暴击${cur.critCount}/黑天鹅${cur.swanCount}`)
})

test('新手保护：前3回合黑天鹅免疫', () => {
  const run = createRun('easy', ['stock'], 'R3')
  let cur = run
  for (let i = 0; i < 3; i++) cur = advanceStep(cur)
  assert.equal(cur.swanCount, 0)
})

test('撤离规则：未达标拒绝、达标结算（含现实换算与排位分）', () => {
  const run = createRun('normal', ['bond'], 'R1')
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

test('破产与超时判定', () => {
  // 黑天鹅概率拉满 + 债券容器（波动最小）：一步后价值损失下限约 -66，副收益上限 +30，金币 1 必转负 → busted
  const zero = { ...createRun('normal', ['bond'], 'R1'), gold: 1, blackSwanPct: 1.0 }
  assert.equal(advanceStep(zero).status, 'busted')

  // 超时未达标：无论一步后金币如何，都低于目标 → busted
  const timeout = { ...createRun('normal', ['bond'], 'R1'), turn: 24, maxTurns: 25, gold: 1000, targetGold: 2000 }
  assert.equal(advanceStep(timeout).status, 'busted')
})

test('段位映射：排位分 → 青铜~王者', () => {
  assert.equal(tierOf(0).tier, 'bronze')
  assert.equal(tierOf(150).tier, 'silver')
  assert.equal(tierOf(350).tier, 'gold')
  assert.equal(tierOf(800).tier, 'platinum')
  assert.equal(tierOf(1600).tier, 'diamond')
  assert.equal(tierOf(3200).tier, 'king')
})
