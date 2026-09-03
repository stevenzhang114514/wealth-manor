/**
 * 夺金冒险引擎 v3（业务逻辑层，纯函数可单测）
 * 横屏地牢探险：
 *   地牢房间随机生成且连通，每个房间 = 一个板块（经济作物/粮油/金属/油气）
 *   房间内可能有 无/低级/中级/高级 箱子；可能有怪物（=金融风险事件化身）
 *   玩家限时（45~90s 真实倒计时）探索：移动→开箱→遇怪三选博弈→返回入口撤离达标
 * 价值 = 基础值 × 品质倍数 × 箱子档倍 × (1+板块景气度) × 容器波动抽样
 */
import { DIFFICULTIES, RANKS, GOLD_TO_CNY } from '../data/adventures.js'
import { SECTORS } from '../data/sectors.js'
import { CONTAINERS } from '../data/containers.js'
import { QUALITIES } from '../data/qualities.js'
import { MONSTERS } from '../data/monsters.js'
import { RISK_RANK } from '../data/products.js'
import { createSeededRandom } from '../utils/random.js'

export const DUNGEON_W = 4
export const DUNGEON_H = 3
export const ENTRY = { x: 0, y: 1 } // 入口 = 撤离点

/** 箱子分布表：无/低/中/高 */
export const CHEST_TABLE = [
  { tier: null, probability: 0.2 },
  { tier: 'low', probability: 0.4 },
  { tier: 'mid', probability: 0.25 },
  { tier: 'high', probability: 0.15 },
]
export const CHEST_MULT = { low: 1, mid: 2, high: 3.5 }

/** 箱子对品质概率的加权（低箱无传说、高箱传说1%） */
export const CHEST_QUALITY_WEIGHT = {
  low: { common: 0.76, fine: 0.18, rare: 0.05, epic: 0.01, legend: 0 },
  mid: { common: 0.66, fine: 0.22, rare: 0.09, epic: 0.025, legend: 0.005 },
  high: { common: 0.5, fine: 0.26, rare: 0.17, epic: 0.06, legend: 0.01 },
}

/** 生成连通地牢（纯函数，seed 可复现）：4×3 网格 + 确定性墙保证全连通 */
export function generateDungeon(seed = 20260813) {
  const rand = createSeededRandom(seed)
  const rooms = []
  for (let y = 0; y < DUNGEON_H; y++) {
    for (let x = 0; x < DUNGEON_W; x++) {
      const sector = SECTORS[Math.floor(rand() * SECTORS.length)]
      // 箱子按分布表 roll
      const p = rand()
      let acc = 0
      let chest = null
      for (const c of CHEST_TABLE) {
        acc += c.probability
        if (p <= acc) {
          chest = c.tier
          break
        }
      }
      const isEntry = x === ENTRY.x && y === ENTRY.y
      rooms.push({
        id: `r_${x}_${y}`,
        x,
        y,
        sectorId: sector.id,
        chest: isEntry ? null : chest, // 入口无箱
        monster: null,
        visited: isEntry,
      })
    }
  }
  const byId = new Map(rooms.map((r) => [r.id, r]))
  const neighbors = (r) => {
    const list = []
    if (r.x > 0) list.push(byId.get(`r_${r.x - 1}_${r.y}`))
    if (r.x < DUNGEON_W - 1) list.push(byId.get(`r_${r.x + 1}_${r.y}`))
    if (r.y > 0) list.push(byId.get(`r_${r.x}_${r.y - 1}`))
    if (r.y < DUNGEON_H - 1) list.push(byId.get(`r_${r.x}_${r.y + 1}`))
    return list.filter(Boolean)
  }

  // 随机放怪物：放置在 x≥2 的房间（深处，概率 ~60% 放 1~2 只）
  const deepRooms = rooms.filter((r) => r.x >= 2 && rand() < 0.5)
  for (const r of deepRooms.slice(0, 1 + Math.floor(rand() * 2))) {
    r.monster = { ...MONSTERS[Math.floor(rand() * MONSTERS.length)] }
  }

  return { width: DUNGEON_W, height: DUNGEON_H, rooms, byId, neighbors }
}

/** 品质 roll 按箱子档加权（纯函数） */
export function rollQuality(tier = 'mid', rng = Math.random) {
  const w = CHEST_QUALITY_WEIGHT[tier] ?? CHEST_QUALITY_WEIGHT.mid
  const p = rng()
  let acc = 0
  for (const q of QUALITIES) {
    acc += w[q.id] ?? q.probability
    if (p <= acc) return { ...q }
  }
  return { ...QUALITIES[0] }
}

/** 品质升一档（纯函数）：传说封顶 */
export function upgradeQuality(q) {
  const idx = QUALITIES.findIndex((x) => x.id === q.id)
  return { ...(QUALITIES[Math.min(idx + 1, QUALITIES.length - 1)] ?? q) }
}

/** 板块景气度（纯函数） */
export function sectorMood(sector, econCycle, rng = Math.random) {
  const bias = sector.cycleBias[econCycle] ?? 0
  const factor = bias + (rng() - 0.5) * 1.6
  const label = factor > 0.8 ? '景气' : factor < -0.8 ? '低迷' : '平稳'
  const icon = factor > 0.8 ? '🔥' : factor < -0.8 ? '❄️' : '🌤️'
  return { label, icon, factor: +factor.toFixed(2) }
}

/** 容器资格（纯函数） */
export function eligibleContainers(level) {
  const rank = RISK_RANK[level] ?? 1
  return CONTAINERS.map((c) => ({
    ...c,
    lock: RISK_RANK[c.unlockRisk] > rank ? { type: 'risk', reason: `需风评达 ${c.unlockRisk}（您当前 ${level}）` } : null,
  }))
}

/** 创建一局（纯函数）：地牢地图 + 双容器 + 限时 */
export function createRun(difficultyId, containerIds, riskLevel, startedAt = Date.now(), seed = 20260813) {
  const diff = DIFFICULTIES.find((d) => d.id === difficultyId)
  if (!diff) return null
  const rand = createSeededRandom(seed)
  const rank = RISK_RANK[riskLevel] ?? 1
  const containers = (containerIds ?? []).filter((id) => {
    const c = CONTAINERS.find((x) => x.id === id)
    return c && RISK_RANK[c.unlockRisk] <= rank
  })
  const dungeon = generateDungeon(seed)
  return {
    id: `r_${startedAt}_${Math.floor(rand() * 10000)}`,
    difficultyId: diff.id,
    difficultyName: diff.name,
    startGold: diff.startGold,
    gold: diff.startGold,
    targetGold: diff.startGold * diff.targetMultiple,
    timeLimit: diff.timeLimit,
    startedAt,
    maxTurns: diff.maxTurns,
    rankFactor: diff.rankFactor,
    containers,
    currentContainer: containers[0] ?? null,
    econCycle: 'recovery',
    pos: { ...ENTRY },
    dungeon: { width: dungeon.width, height: dungeon.height, rooms: dungeon.rooms.map((r) => ({ ...r, monster: r.monster ? { ...r.monster } : null })) },
    explored: [ENTRY.x, ENTRY.y],
    log: [],
    lastStep: null,
    awaitPlayer: null, // 怪物遭遇卡等待玩家决策
    status: 'playing',
    result: null,
    chestOpened: 0,
  }
}

const roomAt = (run, x, y) =>
  run.dungeon.rooms.find((r) => r.x === x && r.y === y)

/** 当前房间（便捷） */
export function currentRoom(run) {
  return roomAt(run, run.pos.x, run.pos.y)
}

/** 行动驱动一步（纯函数）：action = move|open|fight|defend|flee|extract */
export function advanceStep(runInput, action = {}, nowMs = Date.now()) {
  const r = structuredClone(runInput)
  if (r.status !== 'playing') return r

  // 超时校验（真实时间）
  const elapsed = (nowMs - r.startedAt) / 1000
  if (elapsed > r.timeLimit) {
    r.status = 'busted'
    r.result = { reason: 'timeout' }
    r.log.push({ text: '⏰ 时间耗尽！未能按时撤离，本局失败' })
    return r
  }
  const rng = createSeededRandom(r.chestOpened * 7919 + (runInput.pos?.x ?? 0) * 131 + 7)
  const room = roomAt(r, r.pos.x, r.pos.y)
  const container = CONTAINERS.find((c) => c.id === r.currentContainer) ?? CONTAINERS[0]

  const act = action.action ?? action
  if (act.containerId && r.containers.includes(act.containerId)) {
    r.currentContainer = act.containerId
  }
  // idle：前端倒计时归零时触发一次（无副作用，仅做超时判定）
  if (act.idle) return r

  // ---------- 移动 ----------
  if (act.move) {
    const dir = act.move
    let nx = r.pos.x
    let ny = r.pos.y
    if (dir === 'left') nx -= 1
    if (dir === 'right') nx += 1
    if (dir === 'up') ny -= 1
    if (dir === 'down') ny += 1
    if (nx < 0 || nx >= r.dungeon.width || ny < 0 || ny >= r.dungeon.height) {
      r.log.push({ text: '🧱 这是一面墙，走不通' })
      return r
    }
    const next = roomAt(r, nx, ny)
    r.pos = { x: nx, y: ny }
    if (!r.explored.some((p, i) => i % 2 === 0 && p === nx && r.explored[i + 1] === ny)) {
      r.explored.push(nx, ny)
    }
    const sector = SECTORS.find((s) => s.id === next.sectorId)
    r.log.push({ text: `🚶 走进「${sector.icon}${sector.name}」房间` })
    // 房间有怪 → 遭遇
    if (next.monster) {
      r.awaitPlayer = { monster: { ...next.monster }, roomId: next.id }
      r.log.push({ text: `👹 遭遇${next.monster.icon}${next.monster.name}！${next.monster.desc}` })
      return r
    }
    return r
  }

  // ---------- 怪物三选（需在 awaitPlayer 状态） ----------
  if (['fight', 'defend', 'flee'].includes(act.choice ?? act.fight ?? '')) {
    const mon = room?.monster
    if (!mon) {
      r.awaitPlayer = null
      return r
    }
    const choice = act.choice ?? 'fight'
    let loss = 0
    if (choice === 'fight') {
      if (rng() < (mon.fightEscape ?? 0.1)) {
        r.log.push({ text: `⚡ 侥幸躲过${mon.icon}${mon.name}的袭击！损失 0` })
      } else {
        const range = mon.lossRange ?? [0.05, 0.15]
        loss = Math.round(r.gold * (range[0] + rng() * (range[1] - range[0])))
        r.log.push({ text: `⚔️ 迎战${mon.icon}${mon.name}：损失 ${loss} 金币` })
      }
    } else if (choice === 'defend') {
      loss = Math.round(r.gold * 0.05)
      r.log.push({ text: `🛡️ 防御${mon.icon}${mon.name}：损失减半 ${loss} 金币（消耗了更多时间）` })
    } else {
      r.log.push({ text: `🏃 逃离${mon.icon}${mon.name}：无损失，但白耗一次行动` })
    }
    r.gold = Math.max(0, r.gold - loss)
    room.monster = null // 击退或逃离后该房间不再遭遇
    r.awaitPlayer = null
    if (r.gold <= 0) {
      r.status = 'busted'
      r.result = { reason: 'broke' }
      r.log.push({ text: '💀 金币清零！本局失败' })
    }
    return r
  }

  // ---------- 开箱 ----------
  if (act.open && room.chest) {
    const tier = room.chest
    const mult = CHEST_MULT[tier]
    const mood = sectorMood(SECTORS.find((s) => s.id === room.sectorId), r.econCycle, rng)
    let quality = rollQuality(tier, rng)
    let upgraded = false
    if (rng() < container.upgradeChance && quality.id !== 'legend') {
      quality = upgradeQuality(quality)
      upgraded = true
    }
    const loot = SECTORS.find((s) => s.id === room.sectorId).items[Math.floor(rng() * 4)]
    const noise = (() => {
      const u1 = Math.max(rng(), 1e-9)
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rng()) * 0.35 * container.volFactor
    })()
    let value = Math.round(loot.baseValue * quality.multiplier * mult * (1 + mood.factor / 100) * (1 + noise))
    const critPct = 0.15 + container.critDelta
    const crit = rng() < critPct
    if (crit) {
      const critMult = 1.5 + rng() * 1.5
      value = Math.round(value * critMult)
    }
    let sideIncome = 0
    if (rng() < container.sideChance) {
      sideIncome = Math.round(container.sideRange[0] + rng() * (container.sideRange[1] - container.sideRange[0]))
    }
    r.gold += value + sideIncome
    r.gold = Math.round(r.gold)
    room.chest = null
    r.chestOpened += 1
    // 每3次开箱切换经济周期（确定性）
    if (r.chestOpened % 3 === 0) {
      const cycles = ['expansion', 'overheating', 'recession', 'recovery']
      r.econCycle = cycles[(r.chestOpened / 3) % 4]
      r.log.push({ text: `🌍 经济进入${r.econCycle === 'expansion' ? '扩张' : r.econCycle === 'overheating' ? '过热' : r.econCycle === 'recession' ? '衰退' : '复苏'}期` })
    }
    r.lastStep = {
      sector: { id: room.sectorId },
      mood,
      container: { id: container.id, name: container.name, emoji: container.emoji },
      chest: { tier, mult },
      quality: { id: quality.id, name: quality.name, emoji: quality.emoji, color: quality.color },
      loot: { ...loot },
      value,
      crit,
      sideIncome,
      upgraded,
    }
    r.log.push({ text: `${quality.emoji}${quality.name}「${loot.name}」 ${value >= 0 ? '+' : ''}${value}${crit ? '（💥暴击）' : ''}${sideIncome ? `（副收益+${sideIncome}）` : ''}${upgraded ? '（⬆️品质升级）' : ''} — 金币 ${Math.round(r.gold)}` })
    return r
  }

  return r
}

/** 撤离（纯函数）：仅入口房间且达标 */
export function tryExtract(runInput) {
  const r = structuredClone(runInput)
  if (r.status !== 'playing') return { ok: false, reason: '本局已结束' }
  if (r.pos.x !== ENTRY.x || r.pos.y !== ENTRY.y) return { ok: false, reason: '必须在入口房间才能撤离' }
  if (r.gold < r.targetGold) return { ok: false, reason: `未达目标 ${r.targetGold} 金币，还不能撤离` }
  const profit = r.gold - r.startGold
  const rankScore = Math.max(0, Math.round((profit / 10) * r.rankFactor + (r.chestOpened || 0)))
  r.status = 'extracted'
  r.result = {
    profit,
    realIncomeYuan: +(profit / GOLD_TO_CNY).toFixed(2),
    rankScore,
    turn: r.chestOpened,
  }
  r.log.push({ text: `🚪 撤离成功！带出 ${profit} 金币，折算现实收入 ¥${(profit / GOLD_TO_CNY).toFixed(2)}` })
  return { ok: true, run: r }
}

/** 段位映射（纯函数） */
export function tierOf(totalScore) {
  const list = [...RANKS].reverse()
  return list.find((t) => totalScore >= t.min) ?? RANKS[0]
}

export { GOLD_TO_CNY, DIFFICULTIES, RANKS, SECTORS, CONTAINERS, QUALITIES, MONSTERS }
