/**
 * 模拟器状态仓库（Pinia）
 * 维护风评等级（localStorage 持久化）与当前会话快照
 */
import { defineStore } from 'pinia'
import { startSession, advanceSession } from '../api/simulator.js'

const RISK_KEY = 'wm-risk-level'

export const useSimulatorStore = defineStore('simulator', {
  state: () => ({
    riskLevel: localStorage.getItem(RISK_KEY) || null,
    session: null,
    products: [],
    scenarios: [],
    loading: false,
  }),
  getters: {
    hasRiskLevel: (s) => !!s.riskLevel,
    surplus: (s) => (s.session ? s.session.income - s.session.expense : 0),
  },
  actions: {
    setRiskLevel(level) {
      this.riskLevel = level
      localStorage.setItem(RISK_KEY, level)
    },
    setSession(session) {
      this.session = session
    },
    async begin(scenarioId) {
      this.loading = true
      try {
        this.session = await startSession(scenarioId, this.riskLevel)
      } finally {
        this.loading = false
      }
    },
    async advance(decision) {
      this.loading = true
      try {
        this.session = await advanceSession(this.session.id, decision)
      } finally {
        this.loading = false
      }
    },
  },
})
