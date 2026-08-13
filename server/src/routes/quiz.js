/**
 * 知识答题路由  /api/v1/quiz
 */
import { Router } from 'express'
import { ok, fail, ERROR_CODES } from '../utils/response.js'
import * as quizService from '../services/quizService.js'

const router = Router()

/** 抽取题目：?n=5（默认5，不返回答案） */
router.get('/questions', async (req, res) => {
  const n = Number(req.query.n ?? 5)
  if (!Number.isInteger(n) || n < 1 || n > 20) {
    return fail(res, ERROR_CODES.BAD_REQUEST, 'n 需为 1~20 的整数')
  }
  const data = await quizService.getQuestions(n)
  ok(res, data)
})

/** 提交答卷：body = { answers: [{ id, answer }] }，返回判分与奖励 */
router.post('/submit', async (req, res) => {
  const { answers } = req.body ?? {}
  if (!Array.isArray(answers) || answers.length === 0) {
    return fail(res, ERROR_CODES.BAD_REQUEST, 'answers 不能为空')
  }
  const data = await quizService.submitAnswers(answers)
  ok(res, data, '判分完成')
})

export default router
