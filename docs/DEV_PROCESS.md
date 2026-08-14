# 开发规范

> 团队协作约定：让新成员 10 分钟上手，让代码评审有据可依。

## 1. 分支与提交

### 分支策略（Git Flow 精简版）

| 分支 | 用途 | 规则 |
|---|---|---|
| `main` | 可演示/可发布的稳定版本 | 仅通过 PR 合并，禁止直接推送 |
| `develop` | 日常开发主线 | 功能分支合并目标 |
| `feature/xxx` | 单个功能开发 | 从 develop 切出，完成后 PR 合回 |
| `fix/xxx` | 缺陷修复 | 同 feature 规则 |

### 提交信息（Conventional Commits）

```
<type>(<scope>): <subject>        # subject 用中文，≤50字

type: feat 新功能 / fix 修复 / docs 文档 / refactor 重构 / test 测试 / chore 杂项
scope: server / web / docs / scripts

示例：
feat(server): 新增任务领取接口 /manor/tasks/:id/claim
fix(web): 修复资产饼图比例在重载后不刷新的问题
docs: 更新 API_SPEC 任务状态机说明
```

## 2. 目录与命名

- 后端 `server/src/`：`routes`（HTTP 层）/ `services`（业务逻辑）/ `providers`（数据来源）/ `middleware` / `data`（数据配置）/ `utils`
- 前端 `web/src/`：`api`（接口封装）/ `components`（组件，按域分子目录）/ `views`（页面）/ `stores` / `composables` / `utils`
- 文件：JS/Vue 用 camelCase（`assetService.js`、`ManorView.vue`）；路由文件名与领域一致
- 接口封装与后端路由**一一对应**：`routes/assets.js` ↔ `api/assets.js`，函数名语义一致
- 组件：单文件组件 PascalCase；Props 用 camelCase 声明

## 3. 接口变更流程（强制）

1. **先改** `docs/API_SPEC.md`：新增/修改接口定义与示例响应
2. 实现 `server/src/routes/` + `services/`（业务规则写成纯函数）
3. 更新 `web/src/api/` 封装与页面
4. 服务层纯函数补充单元测试（`node --test`）
5. 提交信息 scope 注明领域；PR 描述附 API_SPEC diff 链接

## 4. 代码质量

- 统一工具链：ESLint（flat config）+ Prettier（`npm run lint` / `npm run format`）
- 后端业务规则（阶段计算/评分/判分）必须为**纯函数**并单测覆盖
- 金额/比例单位、日期格式遵循 API_SPEC 约定，禁止魔法数字
- 统一响应必须走 `utils/response.js` 的 `ok/fail`，禁止手写 `{code:...}`

## 5. Mock 数据规范

- 新增演示数据一律进 `server/src/data/`（植物/任务/题库/资产），**禁止**散落在服务代码里
- 模拟时序数据（如趋势）用 `utils/random.js` 的确定性随机，保证数据可复现
- Mock Provider 文件头部的"【契约】"注释 = 与真实 Provider 的对接协议，修改必须同步更新

## 6. 环境与运行

| 环境变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | 3000 | 后端端口 |
| `DATA_PROVIDER` | mock | 数据提供方：mock / prod（待实现） |

- 本地开发：`npm run dev:server` + `npm run dev:web`（两个终端）
- 前端 `?embed=1` 为整屏演示模式（截图脚本使用）
- 提交前自检清单：
  - [ ] `npm run lint` 无错误
  - [ ] `npm run test` 全部通过
  - [ ] 新增接口已同步 API_SPEC.md
  - [ ] 演示路径（README）可完整走通
