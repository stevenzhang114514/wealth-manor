/**
 * 庄园域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/icbc/manorProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   getManorState()  → { name, style, level, exp, expToNext, stageName, coins, diamonds, honorPoints }
 *   getPlants()      → [{ id, species, plot, plotType, linkedProduct:{name,category,code,yieldRate},
 *                         plantedAt, redeemed }]  （生长阶段由服务层统一计算）
 *   getWeather()     → { code, label, icon, changePct, changeAmt, tip, effect }
 *   applyRewards(rewards) → 入账后返回最新庄园状态（内存态，重启重置）
 */
import { PORTFOLIO } from '../../data/assets.js'

/** 庄园主档（Mock 内存态：任务/答题奖励实时累加，重启后重置） */
export const manorState = {
  name: '明曦庄园',
  style: '中式',
  level: 8,
  exp: 1230,
  expToNext: 2000,
  coins: 356,
  diamonds: 12,
  honorPoints: 45,
}

/** 庄园阶段名（等级区间 → 名称，与《设计方案》2.3 一致） */
const STAGE_NAMES = [
  { max: 5, name: '萌新小院' },
  { max: 10, name: '精致田园' },
  { max: 20, name: '繁荣农庄' },
  { max: 30, name: '豪华庄园' },
  { max: 50, name: '财富城堡' },
]

const daysAgo = (n) => Date.now() - n * 86400000

/** 演示用户的植物（每株关联一笔真实理财产品，生长阶段由服务层按时间计算；收获后标记 archived） */
const plantsState = [
  {
    id: 'p_1001',
    species: 'sunflower',
    plot: '花园1号地',
    plotType: 'garden',
    linkedProduct: { name: '工银货币A', category: '稳健型', code: '000848', yieldRate: 1.82 },
    plantedAt: daysAgo(40),
    redeemed: false,
  },
  {
    id: 'p_1002',
    species: 'tulip',
    plot: '花园2号地',
    plotType: 'garden',
    linkedProduct: { name: '个人大额存单', category: '稳健型', code: 'CD-20260710', yieldRate: 1.9 },
    plantedAt: daysAgo(3),
    redeemed: false,
  },
  {
    id: 'p_1003',
    species: 'apple',
    plot: '果园1号地',
    plotType: 'orchard',
    linkedProduct: { name: '沪深300ETF联接A', category: '进取型', code: '110020', yieldRate: 6.24 },
    plantedAt: daysAgo(25),
    redeemed: false,
  },
  {
    id: 'p_1004',
    species: 'orange',
    plot: '果园2号地',
    plotType: 'orchard',
    linkedProduct: { name: '工银瑞信双利债券', category: '进取型', code: '485111', yieldRate: 3.05 },
    plantedAt: daysAgo(46),
    redeemed: false,
  },
  {
    id: 'p_1005',
    species: 'oak',
    plot: '温室1号地',
    plotType: 'greenhouse',
    linkedProduct: { name: '工银养老2035(FOF)', category: '长期型', code: '006295', yieldRate: 2.41 },
    plantedAt: daysAgo(10),
    redeemed: false,
  },
  {
    id: 'p_1006',
    species: 'rose',
    plot: '花园3号地',
    plotType: 'garden',
    linkedProduct: { name: '短债理财产品(已赎回)', category: '稳健型', code: '—', yieldRate: 2.1 },
    plantedAt: daysAgo(60),
    redeemed: true,
  },
]

export function getManorState() {
  const stage = STAGE_NAMES.find((s) => manorState.level <= s.max)
  return { ...manorState, stageName: stage?.name ?? '传说庄园' }
}

/** 创建/重命名庄园（新手引导） */
export function createManor({ name, style }) {
  if (name) manorState.name = name
  if (style) manorState.style = style
  return getManorState()
}

export function getPlants() {
  return plantsState.map((p) => ({ ...p, linkedProduct: { ...p.linkedProduct } }))
}

/** 收获：标记植物归档（业务校验在服务层） */
export function harvestPlant(plantId) {
  const plant = plantsState.find((p) => p.id === plantId)
  if (!plant) return null
  plant.archived = true
  plant.harvestedAt = new Date().toISOString()
  return { ...plant, linkedProduct: { ...plant.linkedProduct } }
}

/**
 * 庄园天气 = 当日持仓盈亏的映射（与《设计方案》机制三一致）
 */
export function getWeather() {
  const pct = PORTFOLIO.todayChangePct
  if (pct > 0.005) {
    return { code: 'rainbow', label: '彩虹', icon: '🌈', changePct: pct, changeAmt: PORTFOLIO.todayChange, tip: '单日收益创新高！庄园天降彩虹，限时稀有商店开启', effect: 'rainbow' }
  }
  if (pct > 0) {
    return { code: 'sunny', label: '晴', icon: '☀️', changePct: pct, changeAmt: PORTFOLIO.todayChange, tip: '今日持仓盈利，阳光明媚，植物加速生长中', effect: 'sunny' }
  }
  if (pct < -0.03) {
    return { code: 'storm', label: '暴风雨', icon: '⛈️', changePct: pct, changeAmt: PORTFOLIO.todayChange, tip: '市场大幅回调，冷静！回调往往孕育加仓机会', effect: 'storm' }
  }
  if (pct < 0) {
    return { code: 'rainy', label: '雨', icon: '🌧️', changePct: pct, changeAmt: PORTFOLIO.todayChange, tip: '今日持仓小幅回调，植物略萎靡但不会死亡', effect: 'rainy' }
  }
  return { code: 'cloudy', label: '多云', icon: '⛅', changePct: pct, changeAmt: PORTFOLIO.todayChange, tip: '持仓持平，庄园正常生长', effect: 'cloudy' }
}

/** 奖励入账（金币/经验/钻石累加，仅内存态） */
export function applyRewards(rewards = {}) {
  manorState.coins += rewards.coins ?? 0
  manorState.exp += rewards.exp ?? 0
  manorState.diamonds += rewards.diamond ?? 0
  return getManorState()
}

/** 消费扣款（余额校验在服务层），返回最新庄园状态 */
export function applyCost(costs = {}) {
  manorState.coins -= costs.coins ?? 0
  manorState.diamonds -= costs.diamonds ?? 0
  return getManorState()
}
