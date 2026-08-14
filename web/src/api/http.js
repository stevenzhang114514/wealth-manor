/**
 * axios 实例与统一拦截
 * 约定：后端所有接口返回 { code, message, data }，code=0 为成功。
 * 拦截器解包 data 直接返回，业务层无需重复判断。
 * 【扩展点】生产环境在此接入统一认证 token 注入（请求拦截器）。
 */
import axios from 'axios'
import { toast } from '../utils/toast.js'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 8000,
})

http.interceptors.response.use(
  (res) => {
    const { code, message, data } = res.data
    if (code !== 0) {
      toast(message || '请求失败', 'error')
      return Promise.reject(new Error(message || '请求失败'))
    }
    return data
  },
  (err) => {
    toast('网络异常，请确认后端服务已启动', 'error')
    return Promise.reject(err)
  },
)

export default http
