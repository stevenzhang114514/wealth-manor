/**
 * 社交服务（业务逻辑层）：好友互访 / 浇水 / 排行榜
 */
import { getProvider } from '../providers/index.js'
import { ERROR_CODES } from '../utils/response.js'

const provider = await getProvider('social')
const manorProvider = await getProvider('manor')

/** 好友列表（含当日浇水状态） */
export async function friends() {
  return provider.getFriends()
}

/** 访问好友庄园：返回好友庄园快照与"天气" */
export async function visit(friendId) {
  const friend = provider.getFriend(friendId)
  if (!friend) {
    return { error: { code: ERROR_CODES.NOT_FOUND, message: '好友不存在', httpStatus: 404 } }
  }
  return { data: { friend, weather: provider.getFriendWeather() } }
}

/** 给好友浇水：双方各获金币（每人每日1次） */
export async function water(friendId) {
  const friend = provider.getFriend(friendId)
  if (!friend) {
    return { error: { code: ERROR_CODES.NOT_FOUND, message: '好友不存在', httpStatus: 404 } }
  }
  const watered = provider.waterFriend(friendId)
  if (!watered) {
    return { error: { code: ERROR_CODES.CONFLICT, message: '今天已经浇过水啦，明天再来吧', httpStatus: 409 } }
  }
  const rewards = { coins: 5, exp: 3 }
  const manor = await manorProvider.applyRewards(rewards)
  return { data: { friend: watered, rewards, manor } }
}

/** 偷好友的菜：随机 5~30 金币入账（每人每日1次） */
export async function steal(friendId) {
  const friend = provider.getFriend(friendId)
  if (!friend) {
    return { error: { code: ERROR_CODES.NOT_FOUND, message: '好友不存在', httpStatus: 404 } }
  }
  const stolen = provider.stealFromFriend(friendId)
  if (!stolen) {
    return { error: { code: ERROR_CODES.CONFLICT, message: '今天已经偷过这家菜园啦，明天再来吧', httpStatus: 409 } }
  }
  const manor = await manorProvider.applyRewards({ coins: stolen.coins })
  return { data: { friend: stolen.friend, rewards: { coins: stolen.coins }, manor } }
}

/** 月度资产配置合理性排行榜（演示用户实时插入） */
export async function leaderboard() {
  return { summary: provider.getLeaderboardSummary(), list: provider.getLeaderboard() }
}
