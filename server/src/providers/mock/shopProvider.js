/**
 * 商城域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/prod/shopProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   getItems()     → 商品目录（含 owned/equipped 状态）
 *   buyItem(id)    → 标记已拥有（扣款由服务层经庄园账户执行）
 *   toggleEquip(id)→ 切换装备状态，返回最新目录（皮肤/称号同类互斥，装饰可多装）
 */
import { SHOP_ITEMS } from '../../data/shopItems.js'

/** 已购与装备状态（Mock 内存态，重启重置） */
const inventory = new Map()

export function getItems() {
  return SHOP_ITEMS.map((item) => ({
    ...item,
    owned: inventory.get(item.id)?.owned ?? false,
    equipped: inventory.get(item.id)?.equipped ?? false,
  }))
}

export function buyItem(itemId) {
  if (!SHOP_ITEMS.some((i) => i.id === itemId)) return false
  if (inventory.get(itemId)?.owned) return false
  inventory.set(itemId, { owned: true, equipped: false })
  return true
}

export function toggleEquip(itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId)
  if (!item || !inventory.get(itemId)?.owned) return null
  const state = inventory.get(itemId)

  if (state.equipped) {
    // 卸下
    inventory.set(itemId, { ...state, equipped: false })
  } else {
    // 皮肤/称号同类互斥：先卸下同类已装备项
    if (item.category === 'skin' || item.category === 'title') {
      for (const [id, s] of inventory) {
        const other = SHOP_ITEMS.find((i) => i.id === id)
        if (other && other.category === item.category && s.equipped) {
          inventory.set(id, { ...s, equipped: false })
        }
      }
    }
    inventory.set(itemId, { ...state, equipped: true })
  }
  return getItems()
}

/** 当前装备的装饰摆件（庄园场景渲染用） */
export function getEquippedDecorations() {
  const result = []
  for (const [id, s] of inventory) {
    if (!s.equipped) continue
    const item = SHOP_ITEMS.find((i) => i.id === id)
    if (item?.category === 'decoration' && item.slot) result.push({ ...item })
  }
  return result
}
