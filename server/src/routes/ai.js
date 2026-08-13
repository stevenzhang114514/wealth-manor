/**
 * AI 服务路由  /api/v1/ai
 */
import { Router } from 'express'
import { ok, fail, ERROR_CODES } from '../utils/response.js'
import * as aiService from '../services/aiService.js'

const router = Router()

/** 资产配置建议：健康度 + 预警 + 调仓方案（演示版规则引擎） */
router.get('/portfolio-advice', async (_req, res) => {
  const data = await aiService.getPortfolioAdvice()
  ok(res, data)
})

/** AI 助手对话：body = { message }（演示版规则引擎） */
router.post('/chat', async (req, res) => {
  const { message } = req.body ?? {}
  if (!message || !String(message).trim()) {
    return fail(res, ERROR_CODES.BAD_REQUEST, 'message 不能为空')
  }
  const data = await aiService.chat(message)
  ok(res, data)
})

export default router
