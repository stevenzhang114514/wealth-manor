/**
 * API 路由聚合  /api/v1
 *
 * 【扩展点】新增一个业务领域时：
 *   1. 在 src/routes/ 下新建路由文件；
 *   2. 在下方 router.use(...) 注册一行；
 *   3. 同步更新 docs/API_SPEC.md 接口文档。
 */
import { Router } from 'express'
import assetsRouter from './assets.js'
import manorRouter from './manor.js'
import tasksRouter from './tasks.js'
import quizRouter from './quiz.js'
import aiRouter from './ai.js'
import shopRouter from './shop.js'
import socialRouter from './social.js'
import goalsRouter from './goals.js'
import userRouter from './user.js'

const router = Router()

router.use('/assets', assetsRouter)
router.use('/manor', manorRouter)
router.use('/manor', tasksRouter)
router.use('/quiz', quizRouter)
router.use('/ai', aiRouter)
router.use('/shop', shopRouter)
router.use('/social', socialRouter)
router.use('/goals', goalsRouter)
router.use('/user', userRouter)

export default router
