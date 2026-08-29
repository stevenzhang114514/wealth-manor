/**
 * 财富人生模拟器路由  /api/v1/simulator
 */
import { Router } from 'express'
import { ok, fail, ERROR_CODES } from '../utils/response.js'
import * as simulatorService from '../services/simulatorService.js'
import { getProvider } from '../providers/index.js'

const router = Router()
const provider = await getProvider('simulator')

/** 产品英雄卡目录（可按 风评等级/现金 过滤资格） */
router.get('/products', async (req, res) => {
  const { level, cash } = req.query
  const data =
    level || cash
      ? simulatorService.eligibleProducts(level, Number(cash) || 0)
      : provider.listProducts()
  ok(res, data)
})

/** 风险评估问卷题目（不含答案分值） */
router.get('/risk-assessment', async (_req, res) => {
  ok(res, provider.listRiskQuestions())
})

/** 提交风评答案：body = { answers: [{ id, option }] } */
router.post('/risk-assessment', async (req, res) => {
  const { answers } = req.body ?? {}
  if (!Array.isArray(answers) || answers.length === 0) {
    return fail(res, ERROR_CODES.BAD_REQUEST, 'answers 不能为空')
  }
  const scores = simulatorService.mapAnswersToScores(answers)
  const data = simulatorService.scoreRiskAssessment(scores)
  ok(res, data, `风评完成：${data.levelName}（${data.level}）`)
})

/** 剧本列表 */
router.get('/scenarios', async (_req, res) => {
  ok(res, provider.listScenarios())
})

/** 事件卡目录（知识卡片） */
router.get('/events', async (_req, res) => {
  ok(res, provider.listEvents())
})

/** 开始新会话：body = { scenarioId, riskLevel } */
router.post('/session', async (req, res) => {
  const { scenarioId, riskLevel } = req.body ?? {}
  if (!scenarioId || !riskLevel) {
    return fail(res, ERROR_CODES.BAD_REQUEST, 'scenarioId 与 riskLevel 必填')
  }
  const session = provider.createSession(scenarioId, riskLevel)
  if (!session) {
    return fail(res, ERROR_CODES.NOT_FOUND, '剧本不存在', 404)
  }
  ok(res, session, '会话已创建，开始经营你的财富人生')
})

/** 会话状态 */
router.get('/session/:id', async (req, res) => {
  const session = provider.getSession(req.params.id)
  if (!session) {
    return fail(res, ERROR_CODES.NOT_FOUND, '会话不存在或已过期', 404)
  }
  ok(res, session)
})

/** 推进一回合：body = { buys: [{productId, amount}], redeems: [{index, amount}] } */
router.post('/session/:id/advance', async (req, res) => {
  const session = provider.advanceSession(req.params.id, req.body ?? {})
  if (!session) {
    return fail(res, ERROR_CODES.NOT_FOUND, '会话不存在或已过期', 404)
  }
  // 终局时附带财富偏差护照（复盘四维评价）
  const passport = session.gameOver ? simulatorService.buildPassport(session) : null
  ok(res, { ...session, passport }, '本月结算完成')
})

export default router
