/** AI 服务接口封装（与 server/src/routes/ai.js 一一对应） */
import http from './http.js'

export const getPortfolioAdvice = () => http.get('/ai/portfolio-advice')
