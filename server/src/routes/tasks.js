/**
 * 任务路由  /api/v1/manor/tasks
 */
import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import * as taskService from '../services/taskService.js'

const router = Router()

/** 任务列表（按类别分组） */
router.get('/tasks', async (_req, res) => {
  const data = await taskService.listTasks()
  ok(res, data)
})

/** 领取任务奖励 */
router.post('/tasks/:id/claim', async (req, res) => {
  const result = await taskService.claimTask(req.params.id)
  if (result.error) {
    return fail(res, result.error.code, result.error.message, result.error.httpStatus)
  }
  ok(res, result.data, '奖励已入账')
})

export default router
