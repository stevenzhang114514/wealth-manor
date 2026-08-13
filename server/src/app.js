/**
 * Express 应用装配
 */
import express from 'express'
import cors from 'cors'
import { requestLogger } from './middleware/requestLogger.js'
import { mockAuth } from './middleware/mockAuth.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import apiRouter from './routes/index.js'
import { API_PREFIX } from './config/index.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')

  app.use(cors())
  app.use(express.json())
  app.use(requestLogger)

  // 健康检查（部署探针用）
  app.get('/healthz', (_req, res) => {
    res.json({ code: 0, message: 'ok', data: { status: 'UP', ts: new Date().toISOString() } })
  })

  // 业务接口：统一前缀 + 模拟鉴权（生产替换为工行统一认证）
  app.use(API_PREFIX, mockAuth, apiRouter)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
