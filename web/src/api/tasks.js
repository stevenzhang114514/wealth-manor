/** 任务域接口封装（与 server/src/routes/tasks.js 一一对应） */
import http from './http.js'

export const getTaskList = () => http.get('/manor/tasks')

export const claimTask = (taskId) => http.post(`/manor/tasks/${taskId}/claim`)
