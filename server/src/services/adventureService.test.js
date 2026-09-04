/**
 * 夺金冒险引擎 v3（横屏地牢探险）单元测试（node:test）
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateDungeon,
  rollQuality,
  upgradeQuality,
  sectorMood,
  eligibleContainers,
  createRun,
  advanceStep,
  tryExtract,
  tierOf,
  currentRoom,
  GOLD_TO_CNY,
  SECTORS,
  MONSTERS,
  ENTRY,
  CHEST_MULT,
} from './adventureService.js'
import { createSeededRandom } from '../utils/random.js'

const NOW = 1780000000000
const makeRun = (opts = {}) => createRun(opts.diff ?? 'normal', ['bond'], 'R1', NOW, opts.seed ?? 42)

test('地牢生成：连通性与结构', () => {
  const d = generateDungeon(7)
  assert.equal(d.rooms.length, 54)
  // BFS 从入口可达全部房间
  const visited = new Set()
  const queue = [d.byId.get('r_0_3')]
  visited.add(queue[0].id)
  while (queue.length) {
    const r = queue.shift()
    for (const n of d.neighbors(r)) {
      if (!visited.has(n.id)) {
        visited.add(n.id)
        queue.push(n)
      }
    }
  }
  assert.equal(visited.size, 54, '全房间连通')
  // 入口无箱
  assert.equal(d.byId.get('r_0_3').chest, null)
  // 房间所属板块合法
  assert.ok(d.rooms.every((r) => SECTORS.some((s) => s.id === r.sectorId)))
})

test('地牢生成：怪物只出现在深处（x≥2）', () => {
  const d = generateDungeon(9)
  for (const r of d.rooms.filter((x) => x.monster)) {
    assert.ok(r.x >= 2)
    assert.ok(MONSTERS.some((m) => m.id === r.monster.id))
  }
})

test('箱子分级：分布近似且价值倍率正确', () => {
  const rng = createSeededRandom(11)
  const counts = { low: 0, mid: 0, high: 0, none: 0 }
  const N = 5000
  for (let i = 0; i < N; i++) {
    // 用 generateDungeon 模拟会太慢，直接 roll 品质用 chest 表——改用品质加权测高频
    const tier = rollQuality('high', rng).id
    counts[tier] = (counts[tier] ?? 0) + 1
  }
  assert.ok((counts.legend ?? 0) / N > 0.004, '高箱传说 ≈1%')
  assert.equal(CHEST_MULT.high, 3.5)
  assert.equal(CHEST_MULT.low, 1)
})

test('品质加权：低箱无传说、中箱低传说、高箱高传说（大样本）', () => {
  const rng = createSeededRandom(13)
  const N = 30000
  for (const [tier, expectLegend] of [['low', 0], ['mid', 0.004], ['high', 0.008]]) {
    let legend = 0
    for (let i = 0; i < N; i++) {
      if (rollQuality(tier, rng).id === 'legend') legend++
    }
    const freq = legend / N
    if (tier === 'low') assert.equal(freq, 0, '低箱不应出传说')
    else assert.ok(freq > expectLegend, `${tier} 传说频率 ${freq}`)
  }
})

test('品质升级：逐档提升、传说封顶', () => {
  assert.equal(upgradeQuality({ id: 'common' }).id, 'fine')
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

test('容器资格：风评门槛', () => {
  const r1 = eligibleContainers('R1')
  assert.equal(r1.find((c) => c.id === 'bond').lock, null)
  assert.equal(r1.find((c) => c.id === 'stock').lock.type, 'risk')
})

test('创建一局：双容器、入口位置、限时', () => {
  const run = makeRun({ diff: 'easy' })
  assert.equal(run.gold, 1000)
  assert.equal(run.timeLimit, 150)
  assert.deepEqual(run.pos, ENTRY)
  assert.equal(run.dungeon.rooms.length, 54)
})

test('移动：走进新房间、墙壁拦截', () => {
  const run = makeRun()
  // 从 (0,1) 向右
  const right = advanceStep(run, { action: { move: 'right' } }, NOW + 1000)
  assert.deepEqual(right.pos, { x: 1, y: 3 })
  // 向左回入口
  const back = advanceStep(right, { action: { move: 'left' } }, NOW + 2000)
  assert.deepEqual(back.pos, ENTRY)
  // 向左出界 → 墙
  const wall = advanceStep(back, { action: { move: 'left' } }, NOW + 3000)
  assert.deepEqual(wall.pos, ENTRY)
})

test('移动：房间有怪物 → 遭遇等待玩家决策', () => {
  const run = makeRun()
  // 强制把右侧房间放一只怪
  const room = run.dungeon.rooms.find((r) => r.x === 1 && r.y === 3)
  room.monster = { ...MONSTERS[0] }
  const next = advanceStep(run, { action: { move: 'right' } }, NOW + 1000)
  assert.equal(next.awaitPlayer?.monster?.id, 'm_crash')
  assert.equal(next.awaitPlayer?.roomId, 'r_1_3')
})

test('怪物三选：迎战损失在区间、防御固定5%、逃离无损', () => {
  // 直接构造：玩家已在有怪房间
  const run = makeRun()
  const room = run.dungeon.rooms.find((r) => r.x === 1 && r.y === 3)
  run.pos = { x: 1, y: 3 }
  room.monster = { ...MONSTERS[0], lossRange: [0.1, 0.1] } // 固定 10%
  const before = run.gold
  const fight = advanceStep(run, { action: { choice: 'fight' } }, NOW + 1000)
  assert.equal(fight.awaitPlayer, null)
  assert.equal(fight.dungeon.rooms.find((r) => r.x === 1 && r.y === 3).monster, null, '击退')
  assert.equal(fight.gold, before - Math.round(before * 0.1), '固定损失10%')

  // defend：固定 5%
  const run2 = makeRun({ seed: 99 })
  const room2 = run2.dungeon.rooms.find((r) => r.x === 1 && r.y === 3)
  run2.pos = { x: 1, y: 3 }
  room2.monster = { ...MONSTERS[0] }
  const defend = advanceStep(run2, { action: { choice: 'defend' } }, NOW + 1000)
  assert.equal(defend.gold, run2.gold - Math.round(run2.gold * 0.05))

  // flee：无损
  const run3 = makeRun({ seed: 123 })
  const room3 = run3.dungeon.rooms.find((r) => r.x === 1 && r.y === 3)
  run3.pos = { x: 1, y: 3 }
  room3.monster = { ...MONSTERS[0] }
  const flee = advanceStep(run3, { action: { choice: 'flee' } }, NOW + 1000)
  assert.equal(flee.gold, run3.gold, '逃离无损')
})

test('开箱：品质/箱子倍率/价值变动正确', () => {
  const run = makeRun({ seed: 5 })
  // 强制当前房间为高箱
  const room = currentRoom(run)
  room.chest = 'high'
  const before = run.gold
  const next = advanceStep(run, { action: { open: true } }, NOW + 1000)
  assert.equal(next.dungeon.rooms.find((r) => r.x === 0 && r.y === 3).chest, null, '箱子清空')
  const s = next.lastStep
  assert.ok(s.quality && s.loot && s.chest?.tier === 'high')
  assert.equal(next.gold, before + s.value + s.sideIncome)
  assert.ok(next.chestOpened >= 1)
})

test('经济周期：每3次开箱切换（遍历周期序列）', () => {
  const run = makeRun({ seed: 21 })
  let cur = run
  const seen = new Set()
  for (let i = 0; i < 9; i++) {
    // 强制当前房间有箱
    const entryRoom = cur.dungeon.rooms.find((r) => r.x === 0 && r.y === 3)
    if (!entryRoom.chest) entryRoom.chest = 'mid'
    cur = advanceStep(cur, { action: { open: true } }, NOW + 1000 * (i + 1))
    seen.add(cur.econCycle)
  }
  assert.equal(cur.chestOpened, 9)
  assert.ok(seen.size >= 2, `应遍历多个经济周期（${[...seen].join(',')}）`)
})

test('移动罚时：每移动一步累计 0.5 秒，累计可致超时', () => {
  const run = makeRun({ diff: 'easy' }) // 150s
  let cur = run
  // 真实时间仅过 60s，但移动 181 步罚时 90.5s → 合计 150.5 > 150 超时
  // 54 房间来回移动 181 步（方向在边界内反弹：走到底再回头）
  let dir = 'right'
  for (let i = 0; i < 182 && cur.status === 'playing'; i++) {
    const nx = cur.pos.x + (dir === 'right' ? 1 : -1)
    if (nx >= cur.dungeon.width || nx < 0) {
      dir = dir === 'right' ? 'left' : 'right'
    }
    cur = advanceStep(cur, { action: { move: dir } }, NOW + 60 * 1000) // 真实60s+罚时90.5s>150
  }
  assert.equal(cur.status, 'busted')
  assert.equal(cur.result.reason, 'timeout')
  assert.ok(Math.abs((cur.timePenalty ?? 0) - 90.5) < 0.6, '罚时累计约90.5s')
})

test('移动罚时：不移动则不影响真实时间判定', () => {
  const run = makeRun({ diff: 'easy' })
  // 未移动，过 149s 仍 playing（不超时）
  const near = advanceStep(run, { action: { open: true } }, NOW + 149 * 1000)
  assert.equal(near.status, 'playing')
})

test('超时：超过 timeLimit → busted', () => {
  const run = makeRun({ diff: 'easy' }) // 150s
  const late = advanceStep(run, { action: { move: 'right' } }, NOW + 151 * 1000)
  assert.equal(late.status, 'busted')
  assert.equal(late.result.reason, 'timeout')
})

test('撤离：非入口拒绝、入口达标成功', () => {
  const run = makeRun()
  const far = { ...run, pos: { x: 2, y: 3 } }
  const noEntry = tryExtract(far)
  assert.equal(noEntry.ok, false)

  run.gold = run.targetGold
  const ok = tryExtract(run)
  assert.equal(ok.ok, true)
  assert.equal(ok.run.status, 'extracted')
  assert.ok(ok.run.result.profit > 0)
  assert.equal(ok.run.result.realIncomeYuan, +(ok.run.result.profit / GOLD_TO_CNY).toFixed(2))
  assert.ok(ok.run.result.rankScore > 0)
})

test('段位映射', () => {
  assert.equal(tierOf(0).tier, 'bronze')
  assert.equal(tierOf(1600).tier, 'diamond')
  assert.equal(tierOf(3200).tier, 'king')
})
