/**
 * 用户服务（业务逻辑层）
 */
import { getProvider } from '../providers/index.js'
import { ERROR_CODES } from '../utils/response.js'

const provider = await getProvider('user')

/** 手机号校验（纯函数）：中国大陆 11 位，1 开头 */
export function isValidPhone(phone) {
  return /^1\d{10}$/.test(String(phone ?? ''))
}

/** 登录：校验手机号 → 签发 Mock token */
export async function login(phone) {
  if (!isValidPhone(phone)) {
    return { error: { code: ERROR_CODES.BAD_REQUEST, message: '请输入 11 位有效手机号' } }
  }
  return { data: provider.login(phone) }
}

/** 用户资料（含资产概览） */
export async function profile() {
  return provider.getProfile()
}
