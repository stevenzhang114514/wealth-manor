/** 财富人生模拟器接口封装（与 server/src/routes/simulator.js 一一对应） */
import http from './http.js'

export const getSimProducts = (level, cash) =>
  http.get('/simulator/products', { params: { level, cash } })

export const getRiskQuestions = () => http.get('/simulator/risk-assessment')

export const submitRiskAssessment = (answers) =>
  http.post('/simulator/risk-assessment', { answers })

export const getScenarios = () => http.get('/simulator/scenarios')

export const startSession = (scenarioId, riskLevel) =>
  http.post('/simulator/session', { scenarioId, riskLevel })

export const getSession = (id) => http.get(`/simulator/session/${id}`)

export const advanceSession = (id, decision) =>
  http.post(`/simulator/session/${id}/advance`, decision)
