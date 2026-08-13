/**
 * 庄园路由  /api/v1/manor
 */
import { Router } from 'express'
import { ok } from '../utils/response.js'
import * as manorService from '../services/manorService.js'

const router = Router()

/** 庄园状态：等级/经验/金币/钻石/荣誉点 */
router.get('/state', async (_req, res) => {
  const data = await manorService.getState()
  ok(res, data)
})

/** 庄园天气：当日行情映射（晴/雨/多云/彩虹/暴风雨） */
router.get('/weather', async (_req, res) => {
  const data = await manorService.getWeather()
  ok(res, data)
})

/** 全部植物：生长阶段由服务端按持有期实时计算 */
router.get('/plants', async (_req, res) => {
  const data = await manorService.getPlants()
  ok(res, data)
})

export default router
