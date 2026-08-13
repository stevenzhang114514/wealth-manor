/**
 * 任务服务（业务逻辑层）
 */
import { getProvider } from '../providers/index.js'
import { TASK_CATEGORY_LABELS, TASK_DEFINITIONS } from '../data/tasks.js'
import { ERROR_CODES } from '../utils/response.js'
import { applyRewards } from './manorService.js'

const provider = await getProvider('task')

/** 任务列表（按 日常/周/月/成就 分组，附进度与状态） */
export async function listTasks() {
  const order = ['daily', 'weekly', 'monthly', 'achievement']
  return order.map((category) => ({
    category,
    label: TASK_CATEGORY_LABELS[category],
    tasks: TASK_DEFINITIONS.filter((t) => t.category === category).map((t) => {
      const state = provider.getTaskState(t.id)
      const finished = state.progress >= t.target
      return {
        ...t,
        progress: state.progress,
        claimed: state.claimed,
        // 状态机：finished=已完成可领取；claimed=已领取；否则进行中
        status: state.claimed ? 'claimed' : finished ? 'claimable' : 'ongoing',
      }
    }),
  }))
}

/**
 * 领取任务奖励
 * 业务规则：任务存在 → 未领取 → 进度达标，满足后奖励入账庄园账户
 */
export async function claimTask(taskId) {
  const task = TASK_DEFINITIONS.find((t) => t.id === taskId)
  if (!task) {
    return { error: { code: ERROR_CODES.NOT_FOUND, message: '任务不存在', httpStatus: 404 } }
  }
  const state = provider.getTaskState(taskId)
  if (state.claimed) {
    return { error: { code: ERROR_CODES.CONFLICT, message: '该任务奖励已领取', httpStatus: 409 } }
  }
  if (state.progress < task.target) {
    return { error: { code: ERROR_CODES.CONFLICT, message: '任务尚未完成，继续加油！', httpStatus: 409 } }
  }
  provider.setClaimed(taskId)
  const manor = await applyRewards(task.rewards)
  return { data: { task: { id: task.id, title: task.title }, rewards: task.rewards, manor } }
}
