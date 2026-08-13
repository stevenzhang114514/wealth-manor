/**
 * 请求日志中间件：记录方法、路径、状态码与耗时
 */
export function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`)
  })
  next()
}
