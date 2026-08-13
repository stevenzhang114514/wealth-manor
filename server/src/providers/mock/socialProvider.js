/**
 * 社交域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/icbc/socialProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   getFriends()            → [{ id, name, avatar, manorName, level, score, online, bio, plants }]
 *   getFriend(id)           → 单个好友或 null
 *   hasWateredToday(id)     → boolean（每日1次限制）
 *   waterFriend(id)         → 标记浇水，返回好友（重复返回 null）
 *   getLeaderboard()        → [{ rank, name, avatar, manorName, level, score, isSelf }]
 */
import { FRIENDS, LEADERBOARD, SELF_SCORE } from '../../data/friends.js'
import { PORTFOLIO } from '../../data/assets.js'

/** 当日已浇水好友（Mock 内存态；真实环境按自然日重置） */
const wateredToday = new Set()

export function getFriends() {
  return FRIENDS.map((f) => ({ ...f, plants: [...f.plants], watered: wateredToday.has(f.id) }))
}

export function getFriend(id) {
  const f = FRIENDS.find((x) => x.id === id)
  return f ? { ...f, plants: [...f.plants], watered: wateredToday.has(id) } : null
}

export function hasWateredToday(id) {
  return wateredToday.has(id)
}

export function waterFriend(id) {
  if (!FRIENDS.some((f) => f.id === id) || wateredToday.has(id)) return null
  wateredToday.add(id)
  return getFriend(id)
}

/** 排行榜：演示用户按评分实时插入 */
export function getLeaderboard() {
  const self = {
    id: 'self',
    name: '我（张明）',
    avatar: '🧑‍🌾',
    manorName: '明曦庄园',
    level: 8,
    score: SELF_SCORE,
  }
  const merged = [...LEADERBOARD, self].sort((a, b) => b.score - a.score)
  return merged.map((u, i) => ({ ...u, rank: i + 1, isSelf: u.id === 'self' }))
}

/** 排行榜页头部统计 */
export function getLeaderboardSummary() {
  return {
    participants: LEADERBOARD.length + 1,
    month: '2026年8月',
    selfScore: SELF_SCORE,
    selfRank: LEADERBOARD.filter((u) => u.score > SELF_SCORE).length + 1,
    scoreExplain: '评分 = 资产配置合理性（分散度/风险匹配/流动性）× AI月度评估',
  }
}

/** 访问好友庄园时的"行情天气"（静态 Mock，与好友庄园快照配套） */
export function getFriendWeather() {
  return {
    code: 'sunny',
    label: '晴',
    icon: '☀️',
    changePct: PORTFOLIO.todayChangePct,
    changeAmt: PORTFOLIO.todayChange,
    tip: '好友今日持仓盈利，庄园阳光明媚',
    effect: 'sunny',
  }
}
