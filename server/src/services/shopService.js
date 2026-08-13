/**
 * 装扮商城服务（业务逻辑层）
 */
import { getProvider } from '../providers/index.js'
import { SHOP_ITEMS } from '../data/shopItems.js'
import { ERROR_CODES } from '../utils/response.js'

const provider = await getProvider('shop')
const manorProvider = await getProvider('manor')

/** 余额校验（纯函数）：金币/钻石任一不足则不可购买 */
export function canAfford(state, item) {
  if (!state) return false
  const coins = item.price?.coins ?? 0
  const diamonds = item.price?.diamonds ?? 0
  return state.coins >= coins && state.diamonds >= diamonds
}

/** 商品目录（含拥有/装备状态）+ 当前庄园余额 */
export async function listItems() {
  const [items, manor] = [provider.getItems(), manorProvider.getManorState()]
  return { items, manor }
}

/** 购买：余额校验 → 扣款 → 入库 */
export async function buy(itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId)
  if (!item) {
    return { error: { code: ERROR_CODES.NOT_FOUND, message: '商品不存在', httpStatus: 404 } }
  }
  const state = manorProvider.getManorState()
  if (!canAfford(state, item)) {
    return { error: { code: ERROR_CODES.CONFLICT, message: '余额不足，先去完成任务赚金币吧', httpStatus: 409 } }
  }
  const bought = provider.buyItem(itemId)
  if (!bought) {
    return { error: { code: ERROR_CODES.CONFLICT, message: '已拥有该商品，无需重复购买', httpStatus: 409 } }
  }
  const manor = manorProvider.applyCost(item.price)
  return { data: { item: { id: item.id, name: item.name, emoji: item.emoji }, cost: item.price, manor } }
}

/** 装备/卸下：皮肤与称号同类互斥，装饰可多装 */
export async function toggleEquip(itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId)
  if (!item) {
    return { error: { code: ERROR_CODES.NOT_FOUND, message: '商品不存在', httpStatus: 404 } }
  }
  const items = provider.toggleEquip(itemId)
  if (!items) {
    return { error: { code: ERROR_CODES.CONFLICT, message: '尚未拥有该商品', httpStatus: 409 } }
  }
  return { data: { items, equippedDecorations: provider.getEquippedDecorations() } }
}

/** 我的装扮（含场景装饰摆件列表） */
export async function inventory() {
  return { items: provider.getItems(), equippedDecorations: provider.getEquippedDecorations() }
}
