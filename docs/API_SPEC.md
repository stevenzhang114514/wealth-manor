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

- 鉴权：演示环境由 `mockAuth` 注入演示用户；生产替换为工行统一认证（请求头注入 token）
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
  "liabilities": [{ "id": "l_001", "name": "住房贷款(公积金+商贷)", "amount": 380000, "rate": "3.1%", "institution": "工商银行", "monthlyPayment": 4210 }]
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
[{ "id": "a_001", "name": "工行活期储蓄", "category": "现金及存款", "institution": "工商银行", "balance": 36500, "currency": "CNY", "syncType": "自动" }]
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
  "linkedProduct": { "name": "工银货币A", "category": "稳健型", "code": "000848", "yieldRate": 1.82 },
  "stage": "mature", "stageLabel": "成熟", "emoji": "🌻", "progress": 1,
  "matureAt": "2026-07-17", "matureDays": 7
}]
```

`stage` 枚举：`seed` / `sprout` / `growing` / `mature` / `wilted`

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

## 7. 预留接口（设计方案已定义，原型暂未实现）

| 接口 | 说明 |
|---|---|
| `POST /assets/import` | 资产导入（自动/扫码/OCR/手动四通道） |
| `POST /assets/ocr` | OCR 识别（房产证/车辆/保单） |
| `POST /assets/external-sync` | 外部资产同步（银联/券商授权） |
| `POST /manor/create` | 创建庄园（新手引导） |
| `POST /manor/plant/seed` | 种植种子（关联购买产品） |
| `POST /manor/plant/:id/harvest` | 收获（产品到期） |
| `GET /manor/shop/items` `POST /manor/shop/buy` | 装扮商城 |
| `POST /manor/social/visit` `POST /manor/social/water` | 好友互动 |
| `GET /manor/leaderboard` | 排行榜 |
| `POST /ai/risk-assessment` `POST /ai/goal-planning` `POST /ai/chat` | AI 能力扩展 |
