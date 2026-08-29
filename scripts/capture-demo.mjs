/**
 * 演示截图脚本：无头 Chrome 截取各模块页面（双尺寸：手机 375×812 / 平板 768×1024）
 * 前置：后端(3000)与前端(5173)已启动
 * 输出：screenshots/{name}-{phone|pad}.png（企划书配图仍使用 企划书/img/，互不影响）
 * 运行：npm run capture
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!chrome) {
  console.error('未找到 Chrome/Edge，请设置环境变量 CHROME_PATH 指向浏览器可执行文件')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../screenshots')
mkdirSync(OUT_DIR, { recursive: true })

// skip_login：跳过登录守卫（截图不依赖 localStorage）
const ROUTES = [
  { name: 'login', path: '/login' },
  { name: 'simulator', path: '/simulator?skip_login=1&demo_risk=R3' },
  { name: 'risk', path: '/risk?skip_login=1' },
  { name: 'manor', path: '/manor?skip_onboard=1&skip_login=1' },
  { name: 'assets', path: '/assets?skip_login=1' },
  { name: 'tasks', path: '/tasks?skip_login=1' },
  { name: 'quiz', path: '/quiz?skip_login=1' },
  { name: 'profile', path: '/profile?skip_login=1' },
  { name: 'shop', path: '/shop?skip_login=1' },
  { name: 'social', path: '/social?skip_login=1' },
]

const SIZES = [
  { label: 'phone', w: 375, h: 812 },
  { label: 'pad', w: 768, h: 1024 },
]

for (const r of ROUTES) {
  for (const s of SIZES) {
    const sep = r.path.includes('?') ? '&' : '?'
    const url = `http://localhost:5173${r.path}${sep}embed=1`
    const out = path.join(OUT_DIR, `${r.name}-${s.label}.png`)
    console.log(`截图 ${r.name}-${s.label}: ${url}`)
    execFileSync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        `--window-size=${s.w},${s.h}`,
        '--virtual-time-budget=8000',
        '--screenshot=' + out,
        url,
      ],
      { stdio: 'inherit', timeout: 60000 },
    )
  }
}
console.log(`完成，共 ${ROUTES.length * SIZES.length} 张，输出目录：${OUT_DIR}`)
