/**
 * AI 服务路由  /api/v1/ai（合规版：翻译器 + 体检报告）
 */
import { Router } from 'express'
import { ok, fail, ERROR_CODES } from '../utils/response.js'
import * as aiService from '../services/aiService.js'

const router = Router()

/** 资产体检报告：客观事实陈述 + 风险提示（零建议措辞） */
router.get('/portfolio-report', async (_req, res) => {
  const data = await aiService.getPortfolioReport()
  ok(res, data)
})

/** AI 金融翻译器：body = { message }（只解释名词，不提供投资建议） */
router.post('/chat', async (req, res) => {
  const { message } = req.body ?? {}
  if (!message || !String(message).trim()) {
    return fail(res, ERROR_CODES.BAD_REQUEST, 'message 不能为空')
  }
  const data = await aiService.chat(message)
  ok(res, data)
})

export default router
