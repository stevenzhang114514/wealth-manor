/**
 * 庄园状态仓库（Pinia）
 * 维护跨页面共享的庄园主档与天气：任务领取/答题后由后端返回最新状态并回写。
 */
import { defineStore } from 'pinia'
import { getManorState, getManorWeather } from '../api/manor.js'

export const useManorStore = defineStore('manor', {
  state: () => ({
    state: null,
    weather: null,
    loading: false,
  }),
  getters: {
    coins: (s) => s.state?.coins ?? 0,
    level: (s) => s.state?.level ?? 1,
  },
  actions: {
    async refresh() {
      this.loading = true
      try {
        const [state, weather] = await Promise.all([getManorState(), getManorWeather()])
        this.state = state
        this.weather = weather
      } finally {
        this.loading = false
      }
    },
    /** 后端返回的最新庄园状态回写（领取奖励/答题后调用） */
    setState(state) {
      this.state = state
    },
  },
})
