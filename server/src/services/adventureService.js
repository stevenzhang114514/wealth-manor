/**
 * 夺金冒险引擎（业务逻辑层，纯函数可单测）
 * 摸金撤离玩法：随机事件 + 产品历史收益分布抽样（含随机暴击与黑天鹅）
 * 收益以游戏金币计，100金币 = 1元现实收入（换算展示）
 * 每局达到目标数额即可撤离带出收益；金币清零或超时未达标 → 血本无归
 */
import { DIFFICULTIES, RANKS, GOLD_TO_CNY } from '../data/adventures.js'
import { ADVENTURE_EVENTS, PRODUCT_GROUPS } from '../data/adventureEvents.js'
import { PRODUCTS, RISK_RANK } from '../data/products.js'
import { createSeededRandom, shuffle } from '../utils/random.js'
import { eligibleProducts } from './simulatorService.js'

/** 冒险局装备资格（仅风评门槛，无起投资金门槛） */
export function eligibleGear(level) {
  return eligibleProducts(level, 1e12).map((p) => ({
    ...p,
    lock: p.lock?.type === 'risk' ? p.lock : null,
  }))
}

/** 经济周期对收益分布均值的条件调整（年化百分点） */
export const CYCLE_MEAN_SHIFT = { expansion: 2, overheating: 0.5, recession: -3, recovery: 1 }

/** 收益抽样（纯函数）：周期条件均值 + Box-Muller 正态抽样 → 月收益率% */
export function sampleReturn(product, econCycle, meanShift = 0, rng = Math.random) {
  const dist = product.dist ?? { mean: product.yieldBase, vol: 2 }
  const cycleShift = CYCLE_MEAN_SHIFT[econCycle] ?? 0
  const mean = dist.mean + cycleShift + meanShift
  const vol = dist.vol
  const u1 = Math.max(rng(), 1e-9)
  const u2 = rng()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(-30, Math.min(30, (mean + vol * z) / 12))
}

/** 创建一局（纯函数，seed 可复现） */
export function createRun(difficultyId, gearIds, riskLevel, seed = 20260813) {
  const diff = DIFFICULTIES.find((d) => d.id === difficultyId)
  if (!diff) return null
  const rand = createSeededRandom(seed)
  const rank = RISK_RANK[riskLevel] ?? 1
  const gear = (gearIds ?? []).filter((id) => {
    const p = PRODUCTS.find((x) => x.id === id)
    return p && RISK_RANK[p.riskLevel] <= rank
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
    gear,
    econCycle: 'recovery',
    eventQueue: shuffle([...ADVENTURE_EVENTS], rand),
    log: [],
    lastStep: null,
    critCount: 0,
    swanCount: 0,
    status: 'playing',
    result: null,
  }
}

/**
 * 摸金一步（纯函数）：抽事件 → 装备产品按分布抽样计收益（含暴击/黑天鹅）→ 现金结算
 * 新手保护回合内黑天鹅事件替换为平稳事件
 */
export function advanceStep(runInput) {
  const r = structuredClone(runInput)
  if (r.status !== 'playing') return r
  // 每步确定性随机源（种子=回合数），保证可复现
  const rng = createSeededRandom(r.turn * 7919 + 13)

  let event = r.eventQueue[r.turn % r.eventQueue.length]
  // 事件效果在下方按字段应用（cycle/cashChange/productFilter/meanShift）

  // 新手保护：黑天鹅替换为平稳事件
  if (r.turn < r.noviceProtect && event.type === 'blackswan') {
    event = { id: 'ae_protect', type: 'neutral', icon: '🛡️', title: '新手保护期', desc: '平稳开局：工资到账 +100 金币，先熟悉摸金节奏', effect: { cashChange: 100 } }
  }

  if (event.effect?.cycle) r.econCycle = event.effect.cycle
  if (event.effect?.cashChange) r.gold += event.effect.cashChange

  const step = { event: { ...event }, gains: [], crit: false, swan: false }

  // 装备产品等权重分配收益（历史收益分布抽样 + 暴击/黑天鹅判定）
  if (r.gear.length > 0 && r.gold > 0) {
    const perGear = r.gold / r.gear.length
    let totalGain = 0
    for (const pid of r.gear) {
      const p = PRODUCTS.find((x) => x.id === pid)
      if (!p) continue
      const fxGroup = event.effect?.productFilter
      const shift = fxGroup
        ? (PRODUCT_GROUPS[fxGroup]?.includes(pid) ? event.effect.meanShift ?? 0 : 0)
        : (event.effect?.meanShift ?? 0)
      let rate = sampleReturn(p, r.econCycle, shift, rng)
      if (rng() < r.blackSwanPct) {
        rate = -Math.abs(rate) * (1.2 + rng())
        step.swan = true
        r.swanCount += 1
      } else if (rng() < 0.15) {
        const mult = r.critRange[0] + rng() * (r.critRange[1] - r.critRange[0])
        rate = rate * mult
        step.crit = true
        r.critCount += 1
      }
      const gain = (perGear * rate) / 100
      totalGain += gain
      step.gains.push({ productId: pid, name: p.name, emoji: p.emoji, rate: +rate.toFixed(2), gain: Math.round(gain) })
    }
    r.gold += totalGain
  }

  r.gold = Math.round(r.gold)
  r.turn += 1
  r.lastStep = step
  r.log.push({
    turn: r.turn,
    icon: step.event.icon,
    title: step.event.title,
    text: step.event.desc,
    crit: step.crit,
    swan: step.swan,
    gold: r.gold,
  })

  if (r.gold <= 0) {
    r.status = 'busted'
    r.log.push({ turn: r.turn, icon: '💀', title: '血本无归', text: '金币清零！冒险失败，本局收益归零', gold: 0 })
  } else if (r.turn >= r.maxTurns && r.gold < r.targetGold) {
    r.status = 'busted'
    r.log.push({ turn: r.turn, icon: '⏰', title: '超时未达标', text: `回合耗尽仍差 ¥${Math.round(r.targetGold - r.gold)} 金币，本局失败`, gold: r.gold })
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

export { GOLD_TO_CNY, DIFFICULTIES, RANKS }
