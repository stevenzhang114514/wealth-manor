/**
 * 演示截图脚本：无头 Chrome 截取四大模块页面（375×812 整屏嵌入模式）
 * 前置：后端(3000)与前端(5173)已启动
 * 输出：../企划书/img/{manor,assets,tasks,quiz}.png（供企划书 3.5 平台演示引用）
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
const OUT_DIR = path.resolve(__dirname, '../../企划书/img')
mkdirSync(OUT_DIR, { recursive: true })

const ROUTES = [
  { name: 'manor', path: '/manor?skip_onboard=1' },
  { name: 'assets', path: '/assets' },
  { name: 'tasks', path: '/tasks' },
  { name: 'quiz', path: '/quiz' },
  { name: 'shop', path: '/shop' },
  { name: 'social', path: '/social' },
]

for (const r of ROUTES) {
  const sep = r.path.includes('?') ? '&' : '?'
  const url = `http://localhost:5173${r.path}${sep}embed=1`
  const out = path.join(OUT_DIR, `${r.name}.png`)
  console.log(`截图 ${r.name}: ${url}`)
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=375,812',
      '--virtual-time-budget=8000',
      '--screenshot=' + out,
      url,
    ],
    { stdio: 'inherit', timeout: 60000 },
  )
  console.log(`  已保存: ${out}`)
}
console.log('完成。企划书重新编译即可插入截图（latexmk -xelatex main.tex）。')
