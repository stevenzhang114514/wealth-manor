/**
 * 装扮商城路由  /api/v1/shop
 */
import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import * as shopService from '../services/shopService.js'

const router = Router()

/** 商品目录（含拥有/装备状态）与当前余额 */
router.get('/items', async (_req, res) => {
  const data = await shopService.listItems()
  ok(res, data)
})

/** 购买商品：body = { itemId } */
router.post('/buy', async (req, res) => {
  const { itemId } = req.body ?? {}
  const result = await shopService.buy(itemId)
  if (result.error) {
    return fail(res, result.error.code, result.error.message, result.error.httpStatus)
  }
  ok(res, result.data, '购买成功，已放入庄园仓库')
})

/** 装备/卸下：body = { itemId } */
router.post('/equip', async (req, res) => {
  const { itemId } = req.body ?? {}
  const result = await shopService.toggleEquip(itemId)
  if (result.error) {
    return fail(res, result.error.code, result.error.message, result.error.httpStatus)
  }
  ok(res, result.data, '装扮已更新')
})

/** 我的装扮（含庄园场景摆件） */
router.get('/inventory', async (_req, res) => {
  const data = await shopService.inventory()
  ok(res, data)
})

export default router
