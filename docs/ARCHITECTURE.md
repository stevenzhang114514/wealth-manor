# 架构说明与扩展指南

## 1. 分层架构

本原型遵循"**路由 → 服务 → Provider → 数据**"四层结构，与生产五层架构（客户端→网关→BFF→微服务→数据）一一对应：

```
web/ (Vue3 客户端)
  │  axios, baseURL=/api/v1（vite 开发代理 → server:3000）
  ▼
server/src/routes/       路由层：HTTP 协议、参数校验、统一响应包装
  ▼
server/src/services/     业务逻辑层：阶段计算/评分/判分等纯函数，可单元测试
  ▼
server/src/providers/    Provider 注册表：数据来源的唯一入口（核心扩展点）
  ▼
server/src/data/         数据驱动配置：植物物种/任务定义/题库/模拟资产
```

关键约定：

1. **统一响应**：`{ code, message, data }`，code=0 成功；4xxxx 业务错误；5xxxx 服务端错误（见 `server/src/utils/response.js`）
2. **接口版本化**：全部接口以 `/api/v1` 为前缀，新领域直接新增路由文件并在 `routes/index.js` 注册
3. **数据驱动**：植物物种（`data/plants.js`）、任务（`data/tasks.js`）、题库（`data/quizBank.js`）、模拟资产（`data/assets.js`）均为纯数据配置，加内容 = 改数据不动代码
4. **确定性 Mock**：趋势等模拟数据使用固定种子随机（`utils/random.js`），每次启动数据一致，便于演示与回归

## 2. 核心扩展点

### 2.1 新增业务领域（如商城、社交、OCR）

1. `server/src/routes/` 新建路由文件（参考 `routes/quiz.js` 模板）
2. `server/src/routes/index.js` 注册一行：`router.use('/shop', shopRouter)`
3. `server/src/services/` 新建服务，业务规则写纯函数便于测试
4. 数据通过 `getProvider('<领域>')` 获取，在 `providers/index.js` 与 `providers/mock/` 注册
5. `web/src/api/` 新建接口封装（与路由一一对应），`web/src/views/` 新建页面，`router/index.js` + `TabBar.vue` 注册
6. **先更新 `docs/API_SPEC.md`，再实现代码**

### 2.2 新增植物/任务/题目/商品/问答（纯数据扩展）

- 植物：`server/src/data/plants.js` 的 `SPECIES` 追加一条（名称/表情/成熟周期/波动/颜色）
- 任务：`server/src/data/tasks.js` 的 `TASK_DEFINITIONS` 追加一条 + `MOCK_PROGRESS` 给初始进度
- 题目：`server/src/data/quizBank.js` 追加一条（含解析）
- 商品：`server/src/data/shopItems.js` 追加一条（装饰带 `slot` 场景坐标即自动上庄园实景）
- AI 问答：`server/src/data/chatRules.js` 追加一条（keywords 命中 + reply + chips）
- 成品阶段新增领域（商城/社交/目标）均遵循同一套 `routes → services → providers → data` 扩展模式，可参照 `services/shopService.js` 复制改造

### 2.3 Mock → 真实工行服务替换指南

演示环境使用 Mock Provider（`providers/mock/`），生产环境需实现同契约的真实 Provider：

1. 每个 mock provider 文件头部注释即为**契约定义**（函数签名 + 返回结构），实现时必须完全一致
2. 在 `server/src/providers/icbc/` 下实现同契约文件（对接工行账户/产品/行情/OCR 接口）
3. 在 `providers/index.js` 的 `PROVIDERS` 注册 `icbc` 模式
4. 启动时 `DATA_PROVIDER=icbc` 切换，业务层零改动
5. 鉴权：`middleware/mockAuth.js` 替换为工行统一认证（OAuth2/手机盾）
6. 前端：`api/http.js` 请求拦截器注入认证 token；生产由 API 网关统一转发，去掉 vite 代理

### 2.4 庄园场景 → 游戏引擎替换

演示场景为 SVG 手绘风（`web/src/components/manor/ManorScene.vue`）。生产环境按设计方案以
**Cocos Creator 3.x** 渲染（WebView + JSBridge 集成工行APP）。组件接口保持稳定即可平滑替换：

- Props：`plants`（含 stage/emoji/progress 等后端计算好的展示字段）、`weather`
- Events：`select(plant)` → 打开植物详情弹层

### 2.5 AI 能力升级

`server/src/services/aiService.js` 当前为规则引擎（可解释、合规兜底）。生产按设计方案采用
**"大模型生成 + 规则引擎兜底"双引擎**：大模型负责对话与生成式建议，本文件规则输出作为
兜底基准与合规校验参照。

## 3. 前端约定

- `api/http.js` 拦截器解包统一响应，业务层拿到的即 `data` 本体
- `stores/manor.js` 维护跨页面共享的庄园主档；领取奖励/答题后由后端返回最新状态回写（`setState`）
- `composables/useECharts.js` 处理图表生命周期（挂载前 setOption 自动暂存）
- 演示壳：`App.vue`（桌面三栏）→ `PhoneFrame.vue`（375×812）→ 视图；`?embed=1` 整屏模式
