/**
 * 模拟鉴权中间件（演示环境）
 * 直接注入演示用户，跳过真实认证流程。
 *
 * 【扩展点】生产环境：替换为统一认证校验（OAuth2 / 手机盾），
 * 从请求头解析 token 并校验会话后写入 req.user，业务层无需改动。
 */
export function mockAuth(req, res, next) {
  req.user = { id: 'u_10086', name: '张明' }
  next()
}
