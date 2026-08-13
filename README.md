# 财富庄园 · Wealth Manor

> 工行APP游戏化智能理财与个人财产管理平台 —— 半成品演示原型
> "让理财像玩游戏一样简单，让每个人都能看清自己的全部财富版图。"

本项目是《工行理财游戏化设计方案》的可运行原型，覆盖**庄园主页（种植/天气）、资产看板（配置/趋势/AI建议/财富树）、任务中心、知识答题**四大核心模块，以 **375px 手机框**模拟工行APP内嵌 H5 形态。前后端分离，接口遵循 RESTful 规范，数据层可扩展（Mock ⇄ 真实工行接口）。

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Vue 3 + Vite + Pinia + Vue Router + ECharts | 手机框演示形态，`?embed=1` 整屏模式 |
| 后端 | Node.js + Express 5 | `/api/v1` RESTful，统一 `{code,message,data}` 响应 |
| 数据 | Mock Provider（数据驱动 JSON/JS） | 可切换 `DATA_PROVIDER` 对接真实服务 |
| 测试 | node:test（内置，零依赖） | 服务层纯函数单元测试 |

## 快速启动

前置要求：Node.js ≥ 18.18

```bash
# 1. 安装依赖（根目录一键安装前后端）
npm run setup

# 2. 启动后端（终端1，端口 3000）
npm run dev:server

# 3. 启动前端（终端2，端口 5173）
npm run dev:web
```

浏览器打开 **http://localhost:5173** 即可看到手机框演示。

- 底部 Tab 切换四个模块：🏡庄园 / 📊资产 / 📋任务 / 🎓答题
- 桌面浏览器两侧为产品说明面板；`http://localhost:5173/manor?embed=1` 为整屏模式（截图/投屏用）
- 后端健康检查：http://localhost:3000/healthz

## 演示路径（对应企划书 3.5 平台演示）

1. **庄园主页**：天气=今日行情（晴/雨/彩虹特效与盈亏联动）→ 点击植物查看关联理财产品的持仓与收益 → 等级经验条
2. **资产看板**：总净资产 → 六大类资产配置饼图 → 30天趋势 → 健康度评分环 → AI建议（预警/一键优化）→ 财富树
3. **任务中心**：日常/周/月/成就任务 → 点击"领取"奖励实时入账（观察 Tab 右上角金币变化）
4. **知识答题**：每日5题 → 即时判分 → 金币/经验/徽章碎片奖励

## 目录结构

```
wealth-manor/
├── README.md               # 本文档
├── package.json            # 根级便捷脚本（setup/dev/lint/format）
├── docs/
│   ├── ARCHITECTURE.md     # 架构与扩展点（含 Mock→真实服务替换指南）
│   ├── API_SPEC.md         # 接口规范（变更流程：先改文档再实现）
│   └── DEV_PROCESS.md      # 开发规范（分支/提交/命名/协作）
├── scripts/
│   └── capture-demo.mjs    # 无头浏览器截图（生成企划书配图）
├── server/                 # Express 后端
│   └── src/
│       ├── routes/         # 路由层：/api/v1 各领域路由
│       ├── services/       # 业务逻辑层（含纯函数，可单测）
│       ├── providers/      # 数据提供方注册表（扩展点）
│       ├── middleware/     # 日志/鉴权/错误处理
│       ├── data/           # 数据驱动配置（植物/任务/题库/资产）
│       └── utils/          # 统一响应/确定性随机
└── web/                    # Vue3 前端
    └── src/
        ├── api/            # 接口封装（与后端路由一一对应）
        ├── components/     # 通用组件（手机框/Tab/庄园场景/图表）
        ├── views/          # 四大模块页面
        ├── stores/         # Pinia 状态
        ├── composables/    # 组合式函数（ECharts 挂载）
        └── utils/          # 格式化/Toast
```

## 常用命令

```bash
npm run setup        # 安装前后端依赖
npm run dev:server   # 后端开发（热重载）
npm run dev:web      # 前端开发
npm run test         # 后端单元测试
npm run lint         # 前后端 ESLint
npm run format       # 前后端 Prettier 格式化
```

## 文档索引

- 设计方案：《工行理财游戏化设计方案.md》（上级目录）
- 企划书：`../企划书/main.tex` → 编译 PDF（含本原型演示截图）
- 更多规范详见 `docs/` 下三个文档
