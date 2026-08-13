import { ERROR_CODES } from '../utils/response.js'

/** 未匹配路由 → 404 */
export function notFound(req, res) {
  res.status(404).json({
    code: ERROR_CODES.NOT_FOUND,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    data: null,
  })
}

/** 统一错误处理：任何路由抛出的异常在此收敛，避免堆栈泄露 */
export function errorHandler(err, req, res, _next) {
  console.error('[error]', err)
  res.status(500).json({
    code: ERROR_CODES.INTERNAL,
    message: '服务开小差了，请稍后重试',
    data: null,
  })
}
