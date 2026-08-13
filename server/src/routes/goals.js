/**
 * 目标规划路由  /api/v1/goals
 */
import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import * as goalService from '../services/goalService.js'

const router = Router()

/** 目标测算（可选保存）：body = { goalType, params, save } */
router.post('/plan', async (req, res) => {
  const result = await goalService.planGoal(req.body ?? {})
  if (result.error) {
    return fail(res, result.error.code, result.error.message)
  }
  ok(res, result.data, result.data.goal ? '已保存到我的目标' : '测算完成')
})

/** 已保存的目标列表 */
router.get('/', async (_req, res) => {
  const data = await goalService.goals()
  ok(res, data)
})

export default router
