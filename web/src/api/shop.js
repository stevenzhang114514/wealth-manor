/** 商城域接口封装（与 server/src/routes/shop.js 一一对应） */
import http from './http.js'

export const getShopItems = () => http.get('/shop/items')

export const buyShopItem = (itemId) => http.post('/shop/buy', { itemId })

export const equipShopItem = (itemId) => http.post('/shop/equip', { itemId })

export const getInventory = () => http.get('/shop/inventory')
