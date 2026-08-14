/**
 * 用户路由  /api/v1/user
 */
import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import * as userService from '../services/userService.js'

const router = Router()

/** 登录：body = { phone }（演示环境任意 11 位手机号均通过） */
router.post('/login', async (req, res) => {
  const { phone } = req.body ?? {}
  const result = await userService.login(phone)
  if (result.error) {
    return fail(res, result.error.code, result.error.message)
  }
  ok(res, result.data, '登录成功')
})

/** 用户资料 */
router.get('/profile', async (_req, res) => {
  const data = await userService.profile()
  ok(res, data)
})

export default router
