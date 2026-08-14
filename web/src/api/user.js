/** 用户域接口封装（与 server/src/routes/user.js 一一对应） */
import http from './http.js'

export const login = (phone) => http.post('/user/login', { phone })

export const getUserProfile = () => http.get('/user/profile')
