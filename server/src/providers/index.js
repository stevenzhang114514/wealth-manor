/**
 * Provider 注册表 —— 数据层的统一入口（核心扩展点）
 *
 * 业务服务（services/）只依赖本注册表获取数据提供方，不直接感知数据来源。
 * 通过环境变量 DATA_PROVIDER 切换：
 *   - mock：内置模拟数据（默认，演示/开发环境，数据确定性可复现）
 *   - prod：真实机构接口（待实现）
 *
 * 新增一个 Provider 的步骤：
 *   1. 在 server/src/providers/<模式>/ 下新建 <领域>Provider.js；
 *   2. 其导出必须与 mock 同契约（函数签名与返回结构一致，见各 mock 文件头部注释）；
 *   3. 在下方 PROVIDERS 中注册一行。
 * 详细说明见 docs/ARCHITECTURE.md「Mock → 真实服务替换指南」。
 */
const PROVIDERS = {
  mock: {
    asset: () => import('./mock/assetProvider.js'),
    manor: () => import('./mock/manorProvider.js'),
    task: () => import('./mock/taskProvider.js'),
    quiz: () => import('./mock/quizProvider.js'),
    shop: () => import('./mock/shopProvider.js'),
    social: () => import('./mock/socialProvider.js'),
    goal: () => import('./mock/goalProvider.js'),
    user: () => import('./mock/userProvider.js'),
    simulator: () => import('./mock/simulatorProvider.js'),
    adventure: () => import('./mock/adventureProvider.js'),
  },
  // prod: {
  //   asset: () => import('./prod/assetProvider.js'),
  //   ...
  // },
}

const MODE = process.env.DATA_PROVIDER || 'mock'

export async function getProvider(name) {
  const group = PROVIDERS[MODE]
  if (!group || !group[name]) {
    const hint =
      MODE === 'mock'
        ? `Provider "${name}" 未注册。`
        : `Provider "${name}" 在模式 "${MODE}" 下尚未实现，请参考 docs/ARCHITECTURE.md「Mock → 真实服务替换指南」补充。`
    throw new Error(hint)
  }
  return group[name]()
}
