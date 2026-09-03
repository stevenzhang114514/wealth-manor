/**
 * 夺金冒险路由  /api/v1/adventure
 */
import { Router } from 'express'
import { ok, fail, ERROR_CODES } from '../utils/response.js'
import * as adventureService from '../services/adventureService.js'
import { getProvider } from '../providers/index.js'

const router = Router()
const provider = await getProvider('adventure')
const manorProvider = await getProvider('manor')

/** 四难度配置 */
router.get('/difficulties', async (_req, res) => {
  ok(res, adventureService.DIFFICULTIES)
})

/** 容器（投资方式）：风评门槛过滤 */
router.get('/containers', async (req, res) => {
  const { level } = req.query
  if (!level) return fail(res, ERROR_CODES.BAD_REQUEST, 'level 必填')
  ok(res, adventureService.eligibleContainers(level))
})

/** 板块建筑图鉴（含掉落物目录） */
router.get('/sectors', async (_req, res) => {
  ok(res, adventureService.SECTORS)
})

/** 开始一局：body = { difficultyId, containers: [containerId×2], riskLevel } */
router.post('/run', async (req, res) => {
  const { difficultyId, containers, riskLevel } = req.body ?? {}
  if (!difficultyId || !riskLevel) {
    return fail(res, ERROR_CODES.BAD_REQUEST, 'difficultyId 与 riskLevel 必填')
  }
  if (!Array.isArray(containers) || containers.length < 1) {
    return fail(res, ERROR_CODES.BAD_REQUEST, '至少选择 1 个容器（投资方式）')
  }
  const run = provider.createRun(difficultyId, containers, riskLevel)
  if (!run) {
    return fail(res, ERROR_CODES.NOT_FOUND, '难度不存在', 404)
  }
  ok(res, run, '摸金局开始，祝好运！')
})

/** 开箱一步：body = { containerId }（可选，不传用当前容器） */
router.post('/run/:id/step', async (req, res) => {
  const run = provider.advanceRun(req.params.id, req.body ?? {})
  if (!run) {
    return fail(res, ERROR_CODES.NOT_FOUND, '局不存在或已结束', 404)
  }
  ok(res, run, run.status === 'playing' ? '继续摸金' : '本局已结束')
})

/** 撤离结算：达标才可撤离，成功后金币入庄园、累计排位分 */
router.post('/run/:id/extract', async (req, res) => {
  const result = provider.extractRun(req.params.id)
  if (!result) {
    return fail(res, ERROR_CODES.NOT_FOUND, '局不存在或已结束', 404)
  }
  if (result.error) {
    return fail(res, ERROR_CODES.CONFLICT, '未达目标金额，还不能撤离', 409)
  }
  // 收益入庄园金币（100金币=1元 换算展示），用于装饰/家具消费
  const manor = manorProvider.applyRewards({ coins: result.run.result.profit })
  ok(res, { ...result, manor }, '撤离成功，收益已入庄园')
})

/** 段位榜（好友 + 本人） */
router.get('/rank', async (_req, res) => {
  ok(res, provider.getRank())
})

export default router
