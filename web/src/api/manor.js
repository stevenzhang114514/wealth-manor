/** 庄园域接口封装（与 server/src/routes/manor.js 一一对应） */
import http from './http.js'

export const getManorState = () => http.get('/manor/state')

export const getManorWeather = () => http.get('/manor/weather')

export const getManorPlants = () => http.get('/manor/plants')

export const createManor = (payload) => http.post('/manor/create', payload)

export const harvestPlant = (plantId) => http.post(`/manor/plant/${plantId}/harvest`)
