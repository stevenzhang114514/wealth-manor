/** 目标规划域接口封装（与 server/src/routes/goals.js 一一对应） */
import http from './http.js'

export const planGoal = (goalType, params, save = false) =>
  http.post('/goals/plan', { goalType, params, save })

export const getGoals = () => http.get('/goals')
