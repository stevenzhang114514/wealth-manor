/**
 * 用户域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/prod/userProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   login(phone)   → { token, user }（失败返回 null）
 *   getProfile()   → 用户资料（含资产概览）
 */
import { DEMO_USER } from '../../data/user.js'

export function login(phone) {
  return { token: `mock-token-${phone.slice(-4)}`, user: { ...DEMO_USER, phone: maskPhone(phone) } }
}

export function getProfile() {
  return { ...DEMO_USER }
}

function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}
