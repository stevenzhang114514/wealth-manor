# 接口规范（API Spec v1）

> 变更流程：**先改本文档 → 再改实现 → 最后更新 `web/src/api/` 封装**，保证文档、前后端三方一致。

## 1. 通用约定

- 基础路径：`/api/v1`（版本化，破坏性变更升 v2 并存过渡）
- 请求/响应：`Content-Type: application/json; charset=utf-8`
- 统一响应结构：

```json
{ "code": 0, "message": "ok", "data": { } }
```

| code | 含义 | HTTP 状态 |
|---|---|---|
| 0 | 成功 | 200 |
| 40001 | 参数错误 | 400 |
| 40401 | 资源不存在 | 404 |
| 40901 | 状态冲突（如重复领取） | 409 |
| 50000 | 服务端错误 | 500 |

- 鉴权：演示环境由 `mockAuth` 注入演示用户；生产替换为统一认证（请求头注入 token）
- 金额单位统一为**元**；比例/收益率用小数（0.002 = 0.2%）；日期 `YYYY-MM-DD`

## 2. 资产管理 `/assets`

### GET /assets/overview — 资产总览

```json
{
  "totalAssets": 1535800, "totalLiabilities": 380000, "netWorth": 1155800,
  "todayChange": 2340, "todayChangePct": 0.002,
  "categories": [
    { "category": "现金及存款", "icon": "💰", "color": "#F5B83D", "amount": 86500, "ratio": 0.0563 }
  ],
  "liabilities": [{ "id": "l_001", "name": "住房贷款(公积金+商贷)", "amount": 380000, "rate": "3.1%", "institution": "主发卡行", "monthlyPayment": 4210 }]
}
```

### GET /assets/trend?days=30 — 净资产趋势

`days` 支持 30/90/365，默认 30；其余返回 40001。

```json
{ "days": 30, "points": [{ "date": "2026-07-15", "netWorth": 1119000, "dailyChange": 0 }] }
```

### GET /assets/health-score — 资产健康度评分

```json
{
  "score": 91, "grade": "优秀",
  "dimensions": [
    { "name": "流动性", "score": 100, "comment": "现金类资产约覆盖 5.1 个月支出" },
    { "name": "安全性", "score": 82, "comment": "权益类占比 57.2%，负债率 24.7%" },
    { "name": "收益性", "score": 93, "comment": "近30日净资产收益率 3.47%" }
  ]
}
```

### GET /assets/accounts — 账户明细列表

```json
[{ "id": "a_001", "name": "工资卡活期储蓄", "category": "现金及存款", "institution": "主发卡行", "balance": 36500, "currency": "CNY", "syncType": "自动" }]
```

## 3. 庄园 `/manor`

### GET /manor/state — 庄园状态

```json
{ "name": "明曦庄园", "style": "中式", "level": 8, "exp": 1230, "expToNext": 2000,
  "stageName": "精致田园", "coins": 356, "diamonds": 12, "honorPoints": 45 }
```

### GET /manor/weather — 庄园天气（当日行情映射）

```json
{ "code": "sunny", "label": "晴", "icon": "☀️", "changePct": 0.002, "changeAmt": 2340,
  "tip": "今日持仓盈利，阳光明媚，植物加速生长中", "effect": "sunny" }
```

`code` 枚举：`sunny` / `rainy` / `cloudy` / `rainbow` / `storm`

### GET /manor/plants — 全部植物（服务端计算生长阶段）

```json
[{
  "id": "p_1001", "species": "sunflower", "speciesName": "向日葵", "speciesEmoji": "🌻",
  "plot": "花园1号地", "plotType": "garden",
  "linkedProduct": { "name": "货币基金A", "category": "稳健型", "code": "000848", "yieldRate": 1.82 },
  "stage": "mature", "stageLabel": "成熟", "emoji": "🌻", "progress": 1,
  "matureAt": "2026-07-17", "matureDays": 7
}]
```

`stage` 枚举：`seed` / `sprout` / `growing` / `mature` / `wilted` / `archived`（已收获归档）

## 4. 任务 `/manor/tasks`

### GET /manor/tasks — 任务列表（分组）

```json
[{ "category": "daily", "label": "日常任务",
   "tasks": [{ "id": "t_daily_board", "title": "查看资产看板", "desc": "…", "icon": "📊",
               "target": 1, "progress": 1, "claimed": false, "status": "claimable",
               "rewards": { "coins": 10, "exp": 5 } }] }]
```

`status` 枚举：`ongoing`（进行中）/ `claimable`（可领取）/ `claimed`（已领取）

### POST /manor/tasks/:id/claim — 领取奖励

- 成功 200：`{ "task": {...}, "rewards": {...}, "manor": {最新庄园状态} }`
- 重复领取 409 `40901`；任务未完成 409 `40901`；任务不存在 404 `40401`

## 5. 知识答题 `/quiz`

### GET /quiz/questions?n=5 — 抽取题目（不含答案）

`n` 范围 1~20，默认 5。

```json
[{ "id": "q_001", "question": "什么是\"复利\"？", "options": ["…", "…", "…", "…"] }]
```

### POST /quiz/submit — 提交答卷

请求：`{ "answers": [{ "id": "q_001", "answer": 1 }] }`（answer 为选项下标）

```json
{
  "score": 4, "total": 5,
  "detail": [{ "id": "q_001", "correct": true, "yourAnswer": 1, "rightAnswer": 1, "explain": "…" }],
  "rewards": { "coins": 8, "exp": 4, "badgeFragment": 0 },
  "manor": { "最新庄园状态" }
}
```

奖励规则：答对 1 题 = 2 金币 + 1 经验；满分额外 1 徽章碎片。

## 6. AI 服务 `/ai`

### GET /ai/portfolio-advice — 资产配置建议（演示版规则引擎）

```json
{
  "healthScore": { "score": 91, "grade": "优秀", "dimensions": [...] },
  "warnings": ["权益类资产（股票+基金）占金融资产 57.2%，超出稳健区间（建议≤50%）…"],
  "suggestions": ["应急储备充足：…", "保险配置占比 13.4%，处于合理区间…"],
  "optimizePlan": [{ "action": "调仓", "from": "权益类", "to": "稳健理财", "amount": 20000, "reason": "降低权益集中度" }],
  "disclaimer": "以上建议由规则引擎生成，仅供参考，不构成投资建议。"
}
```

## 7. 庄园闭环 `/manor`

### POST /manor/create — 创建/重命名庄园（新手引导）

请求：`{ "name": "明曦庄园", "style": "中式" }`（style 支持 中式/西式/日式）

响应：`data` 为最新庄园状态（与 GET /manor/state 同构）

### POST /manor/plant/:id/harvest — 收获成熟植物（产品到期赎回）

- 成功 200：`{ "plant": {...}, "rewards": {"coins": 40, "exp": 24}, "manor": {...}, "archived": {...} }`
- 未成熟 409 `40901`（"植物尚未成熟"）；已归档 409；枯萎（提前赎回）409；不存在 404
- 收获后植物 `stage` 变为 `archived`（emoji 🪵），奖励按物种周期递增（花朵40/果树100/林木200 金币）

## 8. 装扮商城 `/shop`

### GET /shop/items — 商品目录

```json
{ "items": [{ "id": "s_deco_fountain", "category": "decoration", "name": "好运喷泉", "emoji": "⛲",
  "rarity": "rare", "price": { "coins": 120 }, "desc": "…", "slot": { "x": 320, "y": 138 },
  "owned": false, "equipped": false }],
  "manor": { "最新庄园状态" } }
```

`category`：`decoration` 装饰（slot 为场景坐标）/ `skin` 皮肤 / `title` 称号；`rarity`：normal/rare/epic/legend

### POST /shop/buy — 购买：`{ itemId }`

余额不足 409 `40901`；已拥有 409；成功返回 `{ item, cost, manor }`（余额已扣减）

### POST /shop/equip — 装备/卸下：`{ itemId }`

皮肤/称号同类互斥（装备新自动卸旧）；装饰可多装。返回 `{ items, equippedDecorations }`

### GET /shop/inventory — 我的装扮（含庄园场景摆件）

## 9. 社交与排行 `/social`

### GET /social/friends — 好友列表

```json
[{ "id": "f_001", "name": "李晓雅", "avatar": "👩", "manorName": "雅苑小筑", "level": 12,
  "score": 92, "online": true, "bio": "定投第366天",
  "plants": [{ "species": "sunflower", "stage": "mature", "emoji": "🌻" }], "watered": false }]
```

### POST /social/visit/:id — 访问好友庄园

返回 `{ friend, weather }`（好友庄园快照 + 天气）

### POST /social/water/:id — 浇水（双方各 +5 金币，每人每日1次）

重复浇水 409 `40901`；成功返回 `{ friend, rewards, manor }`

### GET /social/leaderboard — 月度配置合理性排行榜

```json
{ "summary": { "participants": 11, "month": "2026年8月", "selfScore": 82, "selfRank": 8,
  "scoreExplain": "评分 = 资产配置合理性（分散度/风险匹配/流动性）× AI月度评估" },
  "list": [{ "rank": 1, "name": "林沐宸", "avatar": "🧑‍💼", "manorName": "宸光庄园", "level": 18, "score": 98, "isSelf": false }] }
```

## 10. AI 助手对话 `/ai`

### POST /ai/chat — 规则引擎问答

请求：`{ "message": "我想了解定投" }`

```json
{ "id": "r_dingtou", "reply": "定投是新手友好的投资方式：…", "chips": ["定投多少合适？", "推荐什么产品？"] }
```

规则数据驱动（`data/chatRules.js`，7 条规则 + 默认回复）；生产环境升级为大模型生成 + 本规则兜底

## 11. 资产导入 `/assets`

### POST /assets/import — 四通道导入

请求：`{ "channel": "手动录入", "name": "海外美元存款", "category": "现金及存款", "amount": 50000, "institution": "某外资行" }`

- `channel` 枚举：`自动同步 / 扫码导入 / OCR识别 / 手动录入`
- `category` 枚举：现金及存款/权益类/基金理财/不动产/保险/其他
- 成功返回 `{ account, overview }`（overview 为导入后重算的总览，todayChange 不受影响）

## 12. 目标规划 `/goals`

### POST /goals/plan — 测算（可选保存）

请求：`{ "goalType": "home", "params": { "price": 3000000, "downPaymentPct": 30, "years": 5 }, "save": true }`

`goalType`：`home`（需 price）/ `education`（需 childAge, targetAmount）/ `retirement`（需 monthlyIncome）/ `emergency`（需 monthlyExpense）

```json
{ "goal": { "id": "g_…", "goalType": "home", "label": "购房首付", "params": {...}, "plan": {...}, "createdAt": "2026-08-13" },
  "plan": { "goalType": "home", "targetAmount": 900000, "monthlyNeed": 13577, "durationMonths": 60,
    "suggestion": "…", "products": ["稳健理财组合", "大额存单", "指数基金定投"] } }
```

测算口径：年化 4% 复利（演示），`annuityPayment` 公式见 `goalService.js`

### GET /goals — 已保存目标列表（按创建时间倒序）

## 13. 用户域 `/user`

### POST /user/login — 登录（Mock）

请求：`{ "phone": "13800138000" }`；校验 11 位手机号（`1\d{10}`），失败 400 `40001`。

```json
{ "token": "mock-token-8000", "user": { "id": "u_10086", "phone": "138****8000", "name": "张明",
  "avatar": "🧑‍🌾", "riskLevel": "R3", "riskLevelName": "稳健型", "manorName": "明曦庄园",
  "signupDays": 366, "totalAssets": 1535800, "netWorth": 1155800 } }
```

### GET /user/profile — 用户资料（同 user 结构，含资产概览）

## 14. 预留接口（设计方案已定义，原型暂未实现）

| 接口 | 说明 |
|---|---|
| `POST /assets/ocr` | OCR 识别（房产证/车辆/保单，演示为流程模拟） |
| `POST /assets/external-sync` | 外部资产同步（银联/券商授权） |
| `POST /manor/plant/seed` | 种植种子（关联购买产品） |
| `POST /ai/risk-assessment` | 风险评估（生产接风评系统） |
| `POST /ai/goal-planning` | 已由 `/goals/plan` 替代，此路径保留兼容占位 |
| `POST /ai/chat` | 已实现（规则引擎），待升级大模型 |
| `GET /manor/leaderboard` | 已由 `/social/leaderboard` 替代 |
