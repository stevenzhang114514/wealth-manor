/**
 * 夺金冒险域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/prod/adventureProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   createRun(...)  → 局状态（含 dungeon 地图）
 *   advanceRun(id, action) → 推进后局状态
 *   extractRun(id)  → { run, tierBefore, tierAfter }（失败返回 {error}）
 *   getRank()       → { self, friends }
 */
import { FRIENDS } from '../../data/friends.js'
import * as engine from '../../services/adventureService.js'

/** 局存储（Mock 内存态） */
const runs = new Map()

/** 排位档案（累计排位分，内存态） */
const rankProfile = { totalScore: 0, tier: 'bronze' }

export function createRun(difficultyId, containers, riskLevel) {
  const run = engine.createRun(difficultyId, containers, riskLevel)
  if (!run) return null
  runs.set(run.id, run)
  return structuredClone(run)
}

export function advanceRun(id, decision, nowMs) {
  const run = runs.get(id)
  if (!run) return null
  const next = engine.advanceStep(run, decision?.action ?? decision ?? {}, nowMs)
  runs.set(id, next)
  return structuredClone(next)
}

export function extractRun(id, nowMs = Date.now()) {
  const run = runs.get(id)
  if (!run) return null
  // 超时校验：超时后不可撤离
  const elapsed = (nowMs - run.startedAt) / 1000
  if (elapsed > run.timeLimit) {
    const busted = { ...run, status: 'busted', result: { reason: 'timeout' } }
    runs.set(id, busted)
    return { run: structuredClone(busted), timeout: true }
  }
  const { ok, run: extracted } = engine.tryExtract(run)
  if (!ok) return { error: true }
  runs.set(id, extracted)
  const tierBefore = engine.tierOf(rankProfile.totalScore).tier
  rankProfile.totalScore += extracted.result.rankScore
  const tierAfter = engine.tierOf(rankProfile.totalScore).tier
  rankProfile.tier = tierAfter
  return {
    run: structuredClone(extracted),
    tierBefore,
    tierAfter,
    totalScore: rankProfile.totalScore,
  }
}

export function getRank() {
  const self = {
    id: 'self',
    name: '我（张明）',
    avatar: '🧑‍🌾',
    totalScore: rankProfile.totalScore,
    tier: engine.tierOf(rankProfile.totalScore).tier,
    tierName: engine.tierOf(rankProfile.totalScore).name,
    tierIcon: engine.tierOf(rankProfile.totalScore).icon,
    isSelf: true,
  }
  const friends = FRIENDS.map((f) => {
    const score = f.score * 12
    const tier = engine.tierOf(score)
    return { id: f.id, name: f.name, avatar: f.avatar, totalScore: score, tier: tier.tier, tierName: tier.name, tierIcon: tier.icon, isSelf: false }
  })
  const list = [...friends, self].sort((a, b) => b.totalScore - a.totalScore)
  return { self, list }
}
