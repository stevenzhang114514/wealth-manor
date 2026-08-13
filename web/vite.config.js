import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // 监听 0.0.0.0，允许局域网内手机访问（手机与电脑需在同一 WiFi）
    port: 5173,
    // 开发环境代理：/api → 后端 3000 端口（避免跨域，生产由网关统一转发）
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
