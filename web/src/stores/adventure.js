/**
 * 夺金冒险状态仓库（Pinia）
 * run：当前局状态（内存态，刷新重开）；rank：排位分与段位（localStorage 持久化）
 */
import { defineStore } from 'pinia'
import { startAdventureRun, adventureStep, adventureExtract } from '../api/adventure.js'

const RANK_KEY = 'wm-rank-score'

export const useAdventureStore = defineStore('adventure', {
  state: () => ({
    run: null,
    rankScore: Number(localStorage.getItem(RANK_KEY) || 0),
    rank: null, // { self, list } 段位榜
    loading: false,
  }),
  actions: {
    setRun(run) {
      this.run = run
    },
    async begin(difficultyId, gear, riskLevel) {
      this.loading = true
      try {
        this.run = await startAdventureRun(difficultyId, gear, riskLevel)
      } finally {
        this.loading = false
      }
    },
    async step() {
      this.loading = true
      try {
        this.run = await adventureStep(this.run.id)
      } finally {
        this.loading = false
      }
    },
    async extract() {
      this.loading = true
      try {
        const res = await adventureExtract(this.run.id)
        this.run = res.run
        this.rankScore = res.totalScore
        localStorage.setItem(RANK_KEY, String(res.totalScore))
        return res
      } finally {
        this.loading = false
      }
    },
    async fetchRank() {
      this.rank = await import('../api/adventure.js').then((m) => m.getAdventureRank())
    },
  },
})
