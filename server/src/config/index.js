/**
 * 全局配置
 * 环境变量通过 server/.env 覆盖（演示环境可直接使用默认值）
 */
export const PORT = Number(process.env.PORT || 3000)

export const DATA_PROVIDER = process.env.DATA_PROVIDER || 'mock'

export const API_PREFIX = '/api/v1'
