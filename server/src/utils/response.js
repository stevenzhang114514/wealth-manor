/**
 * 统一响应包装
 * 所有接口遵循 { code, message, data } 结构：
 *   code = 0     成功
 *   code = 4xxxx 业务错误（参数/资源/状态）
 *   code = 5xxxx 服务端错误
 */

export const ERROR_CODES = {
  BAD_REQUEST: 40001,
  NOT_FOUND: 40401,
  CONFLICT: 40901,
  INTERNAL: 50000,
}

export function ok(res, data, message = 'ok') {
  return res.json({ code: 0, message, data })
}

export function fail(res, code, message, httpStatus = 400) {
  return res.status(httpStatus).json({ code, message, data: null })
}
