/** AI 服务接口封装（合规版：翻译器 + 体检报告） */
import http from './http.js'

export const getPortfolioReport = () => http.get('/ai/portfolio-report')

export const translateMessage = (message) => http.post('/ai/chat', { message })
