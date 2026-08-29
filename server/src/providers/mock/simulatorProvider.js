/**
 * 模拟器域 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/prod/simulatorProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   listProducts()        → 产品英雄卡目录
 *   listScenarios()       → 剧本列表
 *   listEvents()          → 事件卡目录
 *   createSession(scenarioId, riskLevel) → 初始会话
 *   getSession(id)        → 会话或 null
 *   advanceSession(id, decision) → 推进后的会话（引擎计算，本层只存状态）
 */
import { PRODUCTS } from '../../data/products.js'
import { RISK_QUESTIONS, RISK_LEVELS } from '../../data/riskQuestions.js'
import { SCENARIOS } from '../../data/scenarios.js'
import { EVENTS } from '../../data/events.js'
import * as engine from '../../services/simulatorService.js'

/** 会话存储（Mock 内存态，重启重置） */
const sessions = new Map()

export function listProducts() {
  return PRODUCTS
}

export function listScenarios() {
  return SCENARIOS
}

export function listEvents() {
  return EVENTS
}

export function listRiskQuestions() {
  return RISK_QUESTIONS.map((q) => ({ id: q.id, question: q.question, options: q.options.map((o) => ({ text: o.text })) }))
}

export function listRiskLevels() {
  return RISK_LEVELS
}

export function createSession(scenarioId, riskLevel) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)
  if (!scenario) return null
  const session = engine.createSession(scenario, riskLevel)
  sessions.set(session.id, session)
  return structuredClone(session)
}

export function getSession(id) {
  const s = sessions.get(id)
  return s ? structuredClone(s) : null
}

export function advanceSession(id, decision) {
  const s = sessions.get(id)
  if (!s) return null
  const next = engine.advanceTurn(s, decision ?? {})
  sessions.set(id, next)
  return structuredClone(next)
}
