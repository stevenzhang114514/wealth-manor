/** 夺金冒险接口封装（与 server/src/routes/adventure.js 一一对应） */
import http from './http.js'

export const getDifficulties = () => http.get('/adventure/difficulties')

export const getAdventureContainers = (level) =>
  http.get('/adventure/containers', { params: { level } })

export const getAdventureSectors = () => http.get('/adventure/sectors')

export const startAdventureRun = (difficultyId, containers, riskLevel) =>
  http.post('/adventure/run', { difficultyId, containers, riskLevel })

export const adventureStep = (runId, containerId) =>
  http.post(`/adventure/run/${runId}/step`, { containerId })

export const adventureExtract = (runId) => http.post(`/adventure/run/${runId}/extract`)

export const getAdventureRank = () => http.get('/adventure/rank')
