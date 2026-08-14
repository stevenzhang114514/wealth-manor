/**
 * 资产域模拟数据（数据驱动：加资产/改数值只需修改本文件）
 * 金额单位：元（人民币）
 */

export const MOCK_USER = {
  id: 'u_10086',
  name: '张明',
  phone: '138****6688',
  riskLevel: 'R3',
  avatar: '🧑‍🌾',
}

/** 资产账户明细（看板下钻用） */
export const ACCOUNTS = [
  { id: 'a_001', name: '工资卡活期储蓄', category: '现金及存款', institution: '主发卡行', balance: 36500, currency: 'CNY', syncType: '自动' },
  { id: 'a_002', name: '定期存款(1年)', category: '现金及存款', institution: '主发卡行', balance: 50000, currency: 'CNY', syncType: '自动' },
  { id: 'a_003', name: 'A股证券账户', category: '权益类', institution: '券商', balance: 68200, currency: 'CNY', syncType: '扫码导入' },
  { id: 'a_004', name: '货币基金A', category: '基金理财', institution: '基金销售平台', balance: 52300, currency: 'CNY', syncType: '自动' },
  { id: 'a_005', name: '沪深300ETF联接A', category: '基金理财', institution: '基金销售平台', balance: 41500, currency: 'CNY', syncType: '授权导入' },
  { id: 'a_006', name: '混合债券基金组合', category: '基金理财', institution: '基金销售平台', balance: 30000, currency: 'CNY', syncType: '自动' },
  { id: 'a_007', name: '自住房产(系统估值)', category: '不动产', institution: '房产估价平台', balance: 1200000, currency: 'CNY', syncType: 'OCR+估值' },
  { id: 'a_008', name: '重疾险(现金价值)', category: '保险', institution: '保险机构', balance: 45000, currency: 'CNY', syncType: 'OCR识别' },
  { id: 'a_009', name: '数字资产钱包', category: '其他', institution: '自持', balance: 12300, currency: 'CNY', syncType: '手动录入' },
]

/** 负债明细 */
export const LIABILITIES = [
  { id: 'l_001', name: '住房贷款(公积金+商贷)', amount: 380000, rate: '3.1%', institution: '主发卡行', monthlyPayment: 4210 },
]

/**
 * 资产大类汇总（当前时点快照）
 * totalAssets / totalLiabilities / netWorth 单位：元
 * todayChange / todayChangePct：当日变动（驱动庄园"天气"）
 */
export const PORTFOLIO = {
  totalAssets: 1535800,
  totalLiabilities: 380000,
  netWorth: 1155800,
  todayChange: 2340,
  todayChangePct: 0.002,
  categories: [
    { category: '现金及存款', icon: '💰', color: '#F5B83D', amount: 86500 },
    { category: '权益类', icon: '📈', color: '#E0524D', amount: 68200 },
    { category: '基金理财', icon: '🌻', color: '#4E8C4E', amount: 123800 },
    { category: '不动产', icon: '🏠', color: '#5B8DB8', amount: 1200000 },
    { category: '保险', icon: '🛡️', color: '#8E7CC3', amount: 45000 },
    { category: '其他', icon: '🎁', color: '#9AA0A6', amount: 12300 },
  ],
}

/** 月度收支（看板现金流图用） */
export const CASHFLOW = {
  monthlyIncome: 28500,
  monthlyExpense: 16800,
  breakdown: [
    { item: '房贷', amount: 4210 },
    { item: '餐饮', amount: 3200 },
    { item: '交通', amount: 980 },
    { item: '购物娱乐', amount: 2600 },
    { item: '子女教育', amount: 3500 },
    { item: '其他', amount: 2310 },
  ],
}
