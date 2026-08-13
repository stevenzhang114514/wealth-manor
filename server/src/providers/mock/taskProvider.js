/**
 * 任务域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/icbc/taskProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   getTaskState(taskId) → { progress, claimed }
 *   setClaimed(taskId)   → void（幂等：已领取时抛 CONFLICT 由服务层捕获）
 */
import { MOCK_PROGRESS } from '../../data/tasks.js'

/** 任务进度（Mock 内存态：领取后 claimed 置真，重启后重置） */
const taskState = new Map(
  Object.entries(MOCK_PROGRESS).map(([id, s]) => [id, { ...s }]),
)

export function getTaskState(taskId) {
  return taskState.get(taskId) ?? { progress: 0, claimed: false }
}

export function setClaimed(taskId) {
  const state = taskState.get(taskId)
  if (!state) return false
  state.claimed = true
  return true
}
