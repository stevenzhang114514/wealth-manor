/** 夺金冒险接口封装（与 server/src/routes/adventure.js 一一对应） */
import http from './http.js'

export const getDifficulties = () => http.get('/adventure/difficulties')

export const getAdventureGear = (level) => http.get('/adventure/gear', { params: { level } })

export const startAdventureRun = (difficultyId, gear, riskLevel) =>
  http.post('/adventure/run', { difficultyId, gear, riskLevel })

export const adventureStep = (runId) => http.post(`/adventure/run/${runId}/step`)

export const adventureExtract = (runId) => http.post(`/adventure/run/${runId}/extract`)

export const getAdventureRank = () => http.get('/adventure/rank')
