/**
 * 模拟器剧本（数据驱动）：三个预设人生阶段
 * goals 为目标现金流需求：在指定回合数内，现金+可变现资产 ≥ targetAmount
 * 1回合 = 1个月
 */
export const SCENARIOS = [
  {
    id: 'college',
    name: '校园青年',
    icon: '🎓',
    startAge: 21,
    desc: '从校园走向社会前的第一课：学会管理第一笔收入与储蓄。',
    monthlyIncome: 3000,
    monthlyExpense: 2200,
    cash: 5000,
    debt: null,
    totalTurns: 36,
    goals: [
      { id: 'g_travel', label: '毕业旅行基金', targetAmount: 30000, turn: 36, desc: '毕业季攒下3万元' },
    ],
  },
  {
    id: 'career',
    name: '职场新人',
    icon: '💼',
    startAge: 24,
    desc: '初入职场：从零建立应急储备，并开始为人生第一个大目标攒首付。',
    monthlyIncome: 8000,
    monthlyExpense: 5500,
    cash: 20000,
    debt: null,
    totalTurns: 60,
    goals: [
      { id: 'g_emergency', label: '应急储备', targetAmount: 30000, turn: 12, desc: '12个月内备足6个月支出的应急资金' },
      { id: 'g_home', label: '购房首付', targetAmount: 300000, turn: 60, desc: '5年内攒出首付30万' },
    ],
  },
  {
    id: 'family',
    name: '青年家庭',
    icon: '👨‍👩‍👧',
    startAge: 30,
    desc: '上有老下有小：在房贷压力下平衡生活、教育与养老三重目标。',
    monthlyIncome: 25000,
    monthlyExpense: 12600,
    cash: 300000,
    debt: { name: '住房贷款', balance: 380000, monthly: 4210, rate: 3.1 },
    totalTurns: 120,
    goals: [
      { id: 'g_edu', label: '子女教育金', targetAmount: 500000, turn: 120, desc: '10年内储备教育金50万' },
      { id: 'g_retire', label: '养老储备', targetAmount: 1000000, turn: 240, desc: '20年长期规划（展示长期复利目标）' },
    ],
  },
]
