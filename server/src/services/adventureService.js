/**
 * 夺金冒险引擎 v2（业务逻辑层，纯函数可单测）
 * 摸金开箱玩法：
 *   板块建筑（经济作物/粮油/金属/油气）随机游走，每一步进入一个板块
 *   容器 = 投资方式（股票/债券/基金，开局3选2，开箱前可切换）
 *   开容器 = 随机事件：五档品质掉落（更高品质更值钱概率更低）× 板块景气度 × 容器波动
 *   随机暴击 / 市场黑天鹅 + 双副收益（金币小奖、品质升级）
 * 每局达到目标数额即可撤离带出收益；金币清零或超时未达标 → 血本无归
 */
import { DIFFICULTIES, RANKS, GOLD_TO_CNY } from '../data/adventures.js'
import { SECTORS } from '../data/sectors.js'
import { CONTAINERS } from '../data/containers.js'
import { QUALITIES } from '../data/qualities.js'
import { RISK_RANK } from '../data/products.js'
import { createSeededRandom } from '../utils/random.js'

/** 经济周期对收益分布均值的条件调整（年化百分点） */
export const CYCLE_MEAN_SHIFT = { expansion: 2, overheating: 0.5, recession: -3, recovery: 1 }

/** 品质掉落 roll（纯函数）：按累计概率表 */
export function rollQuality(rng = Math.random) {
  const p = rng()
  let acc = 0
  for (const q of QUALITIES) {
    acc += q.probability
    if (p <= acc) return { ...q }
  }
  return { ...QUALITIES[0] }
}

/** 品质升一档（纯函数）：传说封顶 */
export function upgradeQuality(q) {
  const idx = QUALITIES.findIndex((x) => x.id === q.id)
  return { ...(QUALITIES[Math.min(idx + 1, QUALITIES.length - 1)] ?? q) }
}

/** 板块景气度（纯函数）：周期加成 + 随机波动 → {label, factor(%点)} */
export function sectorMood(sector, econCycle, rng = Math.random) {
  const bias = sector.cycleBias[econCycle] ?? 0
  const factor = bias + (rng() - 0.5) * 1.6
  const label = factor > 0.8 ? '景气' : factor < -0.8 ? '低迷' : '平稳'
  const icon = factor > 0.8 ? '🔥' : factor < -0.8 ? '❄️' : '🌤️'
  return { label, icon, factor: +factor.toFixed(2) }
}

/** 容器资格（纯函数）：风评门槛过滤 */
export function eligibleContainers(level) {
  const rank = RISK_RANK[level] ?? 1
  return CONTAINERS.map((c) => ({
    ...c,
    lock: RISK_RANK[c.unlockRisk] > rank ? { type: 'risk', reason: `需风评达 ${c.unlockRisk}（您当前 ${level}）` } : null,
  }))
}

/** 创建一局（纯函数，seed 可复现）：装备=双容器 */
export function createRun(difficultyId, containerIds, riskLevel, seed = 20260813) {
  const diff = DIFFICULTIES.find((d) => d.id === difficultyId)
  if (!diff) return null
  const rand = createSeededRandom(seed)
  const rank = RISK_RANK[riskLevel] ?? 1
  const containers = (containerIds ?? []).filter((id) => {
    const c = CONTAINERS.find((x) => x.id === id)
    return c && RISK_RANK[c.unlockRisk] <= rank
  })
  return {
    id: `r_${Date.now()}_${Math.floor(rand() * 10000)}`,
    difficultyId: diff.id,
    difficultyName: diff.name,
    startGold: diff.startGold,
    gold: diff.startGold,
    targetGold: diff.startGold * diff.targetMultiple,
    turn: 0,
    maxTurns: diff.maxTurns,
    blackSwanPct: diff.blackSwanPct,
    critRange: diff.critRange,
    rankFactor: diff.rankFactor,
    noviceProtect: diff.noviceProtect,
    containers,
    currentContainer: containers[0] ?? null,
    econCycle: 'recovery',
    log: [],
    lastStep: null,
    critCount: 0,
    swanCount: 0,
    status: 'playing',
    result: null,
  }
}

/**
 * 开箱一步（纯函数）：随机进入板块 → 用指定容器开箱 → 品质掉落 → 暴击/黑天鹅 → 双副收益
 * decision: { containerId }（可选，不传用当前容器）
 */
export function advanceStep(runInput, decision = {}) {
  const r = structuredClone(runInput)
  if (r.status !== 'playing') return r
  const rng = createSeededRandom(r.turn * 7919 + 13)

  // 切换容器（校验在装备列表内）
  if (decision.containerId && r.containers.includes(decision.containerId)) {
    r.currentContainer = decision.containerId
  }
  const container = CONTAINERS.find((c) => c.id === r.currentContainer) ?? CONTAINERS[0]

  // 1. 随机游走进入板块
  const sector = SECTORS[Math.floor(rng() * SECTORS.length)]

  // 2. 板块景气度
  const mood = sectorMood(sector, r.econCycle, rng)

  // 3. 品质掉落（新手保护期传说/珍品照常，黑天鹅保护见后）
  let quality = rollQuality(rng)

  // 4. 副收益二：品质升级（先于价值计算）
  let upgraded = false
  if (rng() < container.upgradeChance && quality.id !== 'legend') {
    quality = upgradeQuality(quality)
    upgraded = true
  }

  // 5. 掉落物与价值 = 基础值 × 品质倍数 × 景气系数 × 容器波动噪声
  const loot = sector.items[Math.floor(rng() * sector.items.length)]
  const noise = boxMuller(rng) * 0.35 * container.volFactor
  let value = loot.baseValue * quality.multiplier * (1 + mood.factor / 100) * (1 + noise)
  value = Math.round(value)

  // 6. 暴击 / 黑天鹅判定（新手保护期黑天鹅免疫）
  const isProtected = r.turn < r.noviceProtect
  let crit = false
  let swan = false
  if (!isProtected && rng() < r.blackSwanPct) {
    value = -Math.round(Math.abs(value) * (1.2 + rng()))
    swan = true
    r.swanCount += 1
  } else if (rng() < 0.15 + container.critDelta) {
    const mult = r.critRange[0] + rng() * (r.critRange[1] - r.critRange[0])
    value = Math.round(value * mult)
    crit = true
    r.critCount += 1
  }

  // 7. 副收益一：金币小奖
  let sideIncome = 0
  if (rng() < container.sideChance) {
    sideIncome = Math.round(container.sideRange[0] + rng() * (container.sideRange[1] - container.sideRange[0]))
  }

  r.gold += value + sideIncome
  r.gold = Math.round(r.gold)
  r.turn += 1
  r.lastStep = {
    sector: { id: sector.id, name: sector.name, icon: sector.icon, color: sector.color },
    mood,
    container: { id: container.id, name: container.name, emoji: container.emoji },
    quality: { id: quality.id, name: quality.name, emoji: quality.emoji, color: quality.color, multiplier: quality.multiplier },
    loot: { ...loot },
    value,
    crit,
    swan,
    sideIncome,
    upgraded,
  }
  r.log.push({
    turn: r.turn,
    icon: loot.emoji,
    title: `${sector.icon}${sector.name} · ${container.emoji}${container.name}`,
    text: `${quality.emoji}${quality.name}「${loot.name}」 ${value >= 0 ? '+' : ''}${value} 金币${crit ? '（💥暴击）' : ''}${swan ? '（🦢黑天鹅）' : ''}${sideIncome ? `（副收益+${sideIncome}）` : ''}`,
    quality: quality.id,
    crit,
    swan,
    gold: r.gold,
  })

  if (r.gold <= 0) {
    r.status = 'busted'
    r.log.push({ turn: r.turn, icon: '💀', title: '血本无归', text: '金币清零！冒险失败，本局收益归零', gold: 0 })
  } else if (r.turn >= r.maxTurns && r.gold < r.targetGold) {
    r.status = 'busted'
    r.log.push({ turn: r.turn, icon: '⏰', title: '超时未达标', text: `回合耗尽仍差 ${Math.round(r.targetGold - r.gold)} 金币，本局失败`, gold: r.gold })
  }
  return r
}

/** 撤离（纯函数）：仅达标可撤离；返回 {ok, run?, reason?} */
export function tryExtract(runInput) {
  const r = structuredClone(runInput)
  if (r.status !== 'playing') return { ok: false, reason: '本局已结束' }
  if (r.gold < r.targetGold) return { ok: false, reason: `未达目标 ${r.targetGold} 金币，还不能撤离` }
  const profit = r.gold - r.startGold
  const rankScore = Math.max(0, Math.round((profit / 10) * r.rankFactor + r.critCount * 5 + (r.swanCount > 0 ? 10 : 0)))
  r.status = 'extracted'
  r.result = {
    profit,
    realIncomeYuan: +(profit / GOLD_TO_CNY).toFixed(2),
    rankScore,
    critCount: r.critCount,
    swanCount: r.swanCount,
    turn: r.turn,
  }
  r.log.push({ turn: r.turn, icon: '🚪', title: '成功撤离', text: `带出 ${profit} 金币，折算现实收入 ¥${(profit / GOLD_TO_CNY).toFixed(2)}`, gold: r.gold })
  return { ok: true, run: r }
}

/** 段位映射（纯函数）：累计排位分 → 段位 */
export function tierOf(totalScore) {
  const list = [...RANKS].reverse()
  return list.find((t) => totalScore >= t.min) ?? RANKS[0]
}

/** Box-Muller 标准正态抽样（内部工具） */
function boxMuller(rng) {
  const u1 = Math.max(rng(), 1e-9)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

export { GOLD_TO_CNY, DIFFICULTIES, RANKS, SECTORS, CONTAINERS, QUALITIES }
