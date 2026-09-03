/** 社交域接口封装（与 server/src/routes/social.js 一一对应） */
import http from './http.js'

export const getFriends = () => http.get('/social/friends')

export const visitFriend = (friendId) => http.post(`/social/visit/${friendId}`)

export const waterFriend = (friendId) => http.post(`/social/water/${friendId}`)

export const stealFromFriend = (friendId) => http.post(`/social/steal/${friendId}`)

export const getLeaderboard = () => http.get('/social/leaderboard')
