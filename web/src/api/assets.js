/** 资产域接口封装（与 server/src/routes/assets.js 一一对应） */
import http from './http.js'

export const getAssetOverview = () => http.get('/assets/overview')

export const getAssetTrend = (days = 30) => http.get('/assets/trend', { params: { days } })

export const getHealthScore = () => http.get('/assets/health-score')

export const importAsset = (payload) => http.post('/assets/import', payload)
