/**
 * API 冒烟测试：覆盖全部核心接口的成功与错误分支
 * 前置：后端已重启（Mock 内存态重置，保证断言确定性）
 * 运行：npm run smoke
 */
const BASE = 'http://localhost:3000'
const API = BASE + '/api/v1'

let passed = 0
let failed = 0

const check = (name, cond, extra = '') => {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name} ${extra}`)
  }
}

const get = async (path) => {
  const res = await fetch(API + path)
  return { status: res.status, body: await res.json() }
}

const post = async (path, data) => {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  })
  return { status: res.status, body: await res.json() }
}

const run = async () => {
  console.log('▶ 基础与资产')
  let r = await get('/assets/overview')
  check('overview 净资产', r.body.data?.netWorth === 1155800, JSON.stringify(r.body))
  r = await get('/assets/trend?days=30')
  check('trend 31 个点', r.body.data?.points?.length === 31)
  r = await get('/assets/health-score')
  check('health-score 三维度', r.body.data?.dimensions?.length === 3)

  console.log('▶ 庄园闭环')
  r = await get('/manor/state')
  check('庄园状态 level=8', r.body.data?.level === 8)
  r = await post('/manor/create', { name: '冒烟庄园', style: '西式' })
  check('创建庄园改名', r.body.data?.name === '冒烟庄园' && r.body.data?.style === '西式')
  r = await post('/manor/plant/p_1001/harvest')
  check('收获成熟植物 +40金币', r.body.data?.rewards?.coins === 40)
  r = await post('/manor/plant/p_1001/harvest')
  check('重复收获 409', r.status === 409 && r.body.code === 40901)
  r = await post('/manor/plant/p_1002/harvest')
  check('未成熟收获 409', r.status === 409)

  console.log('▶ 商城')
  r = await get('/shop/items')
  check('商品目录 11 件', r.body.data?.items?.length === 11)
  r = await post('/shop/buy', { itemId: 's_deco_fountain' })
  check('购买装饰扣金币', r.body.data?.cost?.coins === 120 && r.body.data.manor.coins === 276)
  r = await post('/shop/buy', { itemId: 's_deco_fountain' })
  check('重复购买 409', r.status === 409)
  r = await post('/shop/buy', { itemId: 's_title_knight' })
  check('购买钻石商品(4钻)', r.body.data?.cost?.diamonds === 4)
  r = await post('/shop/buy', { itemId: 's_skin_xishi' })
  check('再买3钻商品', r.body.code === 0)
  r = await post('/shop/buy', { itemId: 's_deco_windmill' })
  check('再买2钻商品(剩3钻)', r.body.code === 0)
  r = await post('/shop/buy', { itemId: 's_deco_statue' })
  check('余额不足 409(需5钻)', r.status === 409 && r.body.code === 40901)
  r = await post('/shop/equip', { itemId: 's_deco_fountain' })
  check('装备装饰上实景', r.body.data?.equippedDecorations?.some((d) => d.id === 's_deco_fountain'))
  r = await post('/shop/equip', { itemId: 's_deco_fountain' })
  check('再次装备=卸下', r.body.data?.equippedDecorations?.length === 0)

  console.log('▶ 社交与排行')
  r = await get('/social/friends')
  check('好友 5 位', r.body.data?.length === 5)
  r = await post('/social/water/f_001')
  check('浇水 +5 金币', r.body.data?.rewards?.coins === 5)
  r = await post('/social/water/f_001')
  check('重复浇水 409', r.status === 409)
  r = await get('/social/leaderboard')
  const self = r.body.data?.list?.find((u) => u.isSelf)
  check('本人插入排行 rank=9', self?.rank === 9, `rank=${self?.rank}`)

  console.log('▶ AI 对话与目标')
  r = await post('/ai/chat', { message: '我想了解定投' })
  check('定投规则命中', r.body.data?.id === 'r_dingtou')
  r = await post('/ai/chat', { message: '' })
  check('空消息 40001', r.body.code === 40001)
  r = await post('/goals/plan', { goalType: 'home', params: { price: 3000000, downPaymentPct: 30, years: 5 }, save: true })
  check('购房测算 90万目标', r.body.data?.plan?.targetAmount === 900000)
  check('月供在合理区间', r.body.data?.plan?.monthlyNeed > 13000 && r.body.data?.plan?.monthlyNeed < 14500)
  r = await get('/goals')
  check('已存目标 ≥2 条', r.body.data?.length >= 2)

  console.log('▶ 资产导入')
  r = await post('/assets/import', { channel: '手动录入', name: '海外美元存款', category: '现金及存款', amount: 50000 })
  check('导入后净资产 +5万', r.body.data?.overview?.netWorth === 1205800, JSON.stringify(r.body.data?.overview?.netWorth))
  r = await post('/assets/import', { channel: '错误渠道', name: 'x', category: '现金及存款', amount: 1 })
  check('非法渠道 40001', r.body.code === 40001)

  console.log('▶ 用户域')
  r = await post('/user/login', { phone: '13800138000' })
  check('登录返回 token', typeof r.body.data?.token === 'string' && r.body.data.token.startsWith('mock-token'))
  r = await post('/user/login', { phone: '12345' })
  check('非法手机号 40001', r.body.code === 40001)
  r = await get('/user/profile')
  check('资料含风险等级', r.body.data?.riskLevel === 'R3')

  console.log('▶ 兜底')
  r = await get('/nonexistent')
  check('404 统一包装', r.status === 404 && r.body.code === 40401)

  console.log(`\n结果：${passed} 通过 / ${failed} 失败`)
  process.exitCode = failed > 0 ? 1 : 0
}

run().catch((e) => {
  console.error('冒烟测试执行异常：', e.message)
  process.exitCode = 1
})
