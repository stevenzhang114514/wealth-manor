/**
 * 社交路由  /api/v1/social（排行榜挂 /api/v1/leaderboard）
 */
import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import * as socialService from '../services/socialService.js'

const router = Router()

/** 好友列表（含当日浇水状态） */
router.get('/friends', async (_req, res) => {
  const data = await socialService.friends()
  ok(res, data)
})

/** 访问好友庄园 */
router.post('/visit/:id', async (req, res) => {
  const result = await socialService.visit(req.params.id)
  if (result.error) {
    return fail(res, result.error.code, result.error.message, result.error.httpStatus)
  }
  ok(res, result.data)
})

/** 给好友浇水（双方各获金币，每日1次） */
router.post('/water/:id', async (req, res) => {
  const result = await socialService.water(req.params.id)
  if (result.error) {
    return fail(res, result.error.code, result.error.message, result.error.httpStatus)
  }
  ok(res, result.data, `浇水成功，+${result.data.rewards.coins} 金币`)
})

/** 月度资产配置合理性排行榜 */
router.get('/leaderboard', async (_req, res) => {
  const data = await socialService.leaderboard()
  ok(res, data)
})

export default router
