/**
 * 资产管理路由  /api/v1/assets
 */
import { Router } from 'express'
import { ok, fail, ERROR_CODES } from '../utils/response.js'
import * as assetService from '../services/assetService.js'

const router = Router()

/** 资产总览：总资产/净资产/当日变动/大类占比 */
router.get('/overview', async (_req, res) => {
  const data = await assetService.getOverview()
  ok(res, data)
})

/** 净资产趋势：?days=30|90|365（默认30） */
router.get('/trend', async (req, res) => {
  const days = Number(req.query.days ?? 30)
  if (![30, 90, 365].includes(days)) {
    return fail(res, ERROR_CODES.BAD_REQUEST, 'days 仅支持 30 / 90 / 365')
  }
  const data = await assetService.getTrend(days)
  ok(res, { days, points: data })
})

/** 资产健康度评分：0-100 + 三维度明细 */
router.get('/health-score', async (_req, res) => {
  const data = await assetService.getHealthScore()
  ok(res, data)
})

/** 账户明细列表 */
router.get('/accounts', async (_req, res) => {
  const data = await assetService.getAccounts()
  ok(res, data)
})

/** 资产导入（四通道）：body = { channel, name, category, amount, institution } */
router.post('/import', async (req, res) => {
  const result = await assetService.importAsset(req.body ?? {})
  if (result.error) {
    return fail(res, result.error.code, result.error.message)
  }
  ok(res, result.data, '导入成功，资产看板已更新')
})

export default router
