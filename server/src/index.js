/**
 * 服务启动入口
 * 运行：npm run dev（热重载）/ npm start
 */
import { createApp } from './app.js'
import { PORT, DATA_PROVIDER } from './config/index.js'

const app = createApp()

app.listen(PORT, () => {
  console.log('┌─────────────────────────────────────────────┐')
  console.log('│  财富庄园 · Wealth Manor 后端服务           │')
  console.log('└─────────────────────────────────────────────┘')
  console.log(`  接口地址:   http://localhost:${PORT}/api/v1`)
  console.log(`  健康检查:   http://localhost:${PORT}/healthz`)
  console.log(`  数据提供方: ${DATA_PROVIDER}`)
})
