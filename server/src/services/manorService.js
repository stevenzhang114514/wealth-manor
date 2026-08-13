/**
 * 庄园服务（业务逻辑层）
 * 生长阶段计算等纯逻辑与数据获取解耦，便于单元测试。
 */
import { getProvider } from '../providers/index.js'
import { SPECIES, STAGE_DISPLAY } from '../data/plants.js'
import { ERROR_CODES } from '../utils/response.js'

const provider = await getProvider('manor')

/**
 * 生长阶段计算（纯函数）
 * 规则：持有期超过成熟周期 → 成熟；已赎回 → 枯萎；
 *      其余按时间进度分为 种子(0-30%) / 发芽(30-60%) / 生长(60-100%)
 */
export function calcGrowthStage(plantedAt, matureDays, redeemed = false, now = Date.now()) {
  if (redeemed) return 'wilted'
  const elapsedDays = (now - plantedAt) / 86400000
  if (elapsedDays >= matureDays) return 'mature'
  const ratio = elapsedDays / matureDays
  if (ratio < 0.3) return 'seed'
  if (ratio < 0.6) return 'sprout'
  return 'growing'
}

/** 植物信息补全：阶段、展示表情、生长进度、到期时间 */
export function enrichPlant(plant, now = Date.now()) {
  const species = SPECIES[plant.species] ?? SPECIES.hybrid
  const stage = calcGrowthStage(plant.plantedAt, species.matureDays, plant.redeemed, now)
  const display = STAGE_DISPLAY[stage]
  const elapsedDays = (now - plant.plantedAt) / 86400000
  const progress = stage === 'mature' || stage === 'wilted' ? 1 : Math.min(1, elapsedDays / species.matureDays)
  const base = {
    ...plant,
    speciesName: species.name,
    speciesEmoji: species.emoji,
    speciesColor: species.color,
    volatility: species.volatility,
    stage,
    stageLabel: display.label,
    emoji: display.emoji ?? species.emoji,
    progress: +progress.toFixed(2),
    matureAt: new Date(plant.plantedAt + species.matureDays * 86400000).toISOString().slice(0, 10),
    matureDays: species.matureDays,
  }
  // 已收获归档：资金回笼，植物化为庄园装饰（木桩）
  if (plant.archived) {
    return { ...base, stage: 'archived', stageLabel: '已归档', emoji: '🪵' }
  }
  return base
}

/** 庄园状态（含阶段名） */
export async function getState() {
  return provider.getManorState()
}

/** 庄园天气（当日行情映射） */
export async function getWeather() {
  return provider.getWeather()
}

/** 全部植物（含计算后的生长阶段） */
export async function getPlants() {
  const plants = provider.getPlants()
  return plants.map((p) => enrichPlant(p))
}

/** 奖励入账并返回最新庄园状态 */
export async function applyRewards(rewards) {
  return provider.applyRewards(rewards)
}

/** 创建/重命名庄园（新手引导 Step6） */
export async function createManor(payload) {
  return provider.createManor(payload ?? {})
}

/** 收获奖励（纯函数）：奖励规模随生长周期递增（林木 > 果树 > 花朵） */
export function harvestRewards(speciesKey) {
  const species = SPECIES[speciesKey] ?? SPECIES.hybrid
  const base = species.matureDays >= 180 ? 200 : species.matureDays >= 30 ? 100 : 40
  return { coins: base, exp: Math.round(base * 0.6) }
}

/**
 * 收获成熟植物（产品到期赎回映射）：
 * 仅成熟可收获；枯萎（提前赎回）与已归档不可重复收获
 */
export async function harvest(plantId) {
  const plant = provider.getPlants().find((p) => p.id === plantId)
  if (!plant) {
    return { error: { code: ERROR_CODES.NOT_FOUND, message: '植物不存在', httpStatus: 404 } }
  }
  if (plant.archived) {
    return { error: { code: ERROR_CODES.CONFLICT, message: '该植物已收获归档', httpStatus: 409 } }
  }
  const species = SPECIES[plant.species] ?? SPECIES.hybrid
  const stage = calcGrowthStage(plant.plantedAt, species.matureDays, plant.redeemed)
  if (stage === 'wilted') {
    return { error: { code: ERROR_CODES.CONFLICT, message: '提前赎回的枯萎植物无法收获', httpStatus: 409 } }
  }
  if (stage !== 'mature') {
    return { error: { code: ERROR_CODES.CONFLICT, message: '植物尚未成熟，坚持持有静待丰收', httpStatus: 409 } }
  }
  const rewards = harvestRewards(plant.species)
  const archived = provider.harvestPlant(plantId)
  const manor = provider.applyRewards(rewards)
  return { data: { plant: { id: plant.id, speciesName: species.name }, rewards, manor, archived } }
}
