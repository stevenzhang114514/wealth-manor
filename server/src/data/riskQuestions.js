/**
 * 风险评估问卷（10题，每题3档：1/3/5分）
 * 总分 10~50 映射 R1~R5（银行风险评测的简化游戏版，数据驱动）
 */
export const RISK_QUESTIONS = [
  {
    id: 'q1',
    question: '您的投资经验是？',
    options: [
      { text: '几乎没有，只存过活期/定期', score: 1 },
      { text: '买过货币基金或银行理财', score: 3 },
      { text: '投资过股票/基金并持有超1年', score: 5 },
    ],
  },
  {
    id: 'q2',
    question: '投资亏损10%时，您会怎么做？',
    options: [
      { text: '立即全部卖出，保住本金', score: 1 },
      { text: '卖出一部分，观望为主', score: 3 },
      { text: '评估后继续持有甚至加仓', score: 5 },
    ],
  },
  {
    id: 'q3',
    question: '这笔资金计划的投资期限是？',
    options: [
      { text: '1年以内，随时可能要用', score: 1 },
      { text: '1~3年，中期目标', score: 3 },
      { text: '3年以上，长期规划', score: 5 },
    ],
  },
  {
    id: 'q4',
    question: '您的家庭应急储备情况是？',
    options: [
      { text: '几乎没有，月月光', score: 1 },
      { text: '有1~3个月支出的储备', score: 3 },
      { text: '有3~6个月以上支出的储备', score: 5 },
    ],
  },
  {
    id: 'q5',
    question: '您能接受的最大年度亏损是？',
    options: [
      { text: '不能接受任何亏损', score: 1 },
      { text: '能接受10%以内的波动', score: 3 },
      { text: '能接受20%以上的波动', score: 5 },
    ],
  },
  {
    id: 'q6',
    question: '投资资金占您家庭资产的比例？',
    options: [
      { text: '超过70%，几乎全部身家', score: 1 },
      { text: '30%~70%，留有部分储蓄', score: 3 },
      { text: '30%以内，不影响日常生活', score: 5 },
    ],
  },
  {
    id: 'q7',
    question: '对"高收益伴随高风险"的理解是？',
    options: [
      { text: '不太理解，只看收益高低', score: 1 },
      { text: '知道风险，但不太会评估', score: 3 },
      { text: '能结合流动性/期限综合判断', score: 5 },
    ],
  },
  {
    id: 'q8',
    question: '您的收入稳定性如何？',
    options: [
      { text: '不稳定（兼职/自由职业）', score: 1 },
      { text: '较稳定，有固定工资', score: 3 },
      { text: '非常稳定，且有第二收入来源', score: 5 },
    ],
  },
  {
    id: 'q9',
    question: '遇到市场大跌，您会关注什么？',
    options: [
      { text: '立即卖出止损', score: 1 },
      { text: '等待反弹再操作', score: 3 },
      { text: '关注基本面和长期价值', score: 5 },
    ],
  },
  {
    id: 'q10',
    question: '您希望这笔投资达到什么目标？',
    options: [
      { text: '跑赢活期就行，保本第一', score: 1 },
      { text: '稳健增值，兼顾流动', score: 3 },
      { text: '追求高增长，接受大波动', score: 5 },
    ],
  },
]

export const RISK_LEVELS = [
  { level: 'R1', name: '保守型', max: 15, desc: '以保本为第一要务，适合存款、货基等低风险产品' },
  { level: 'R2', name: '稳健型', max: 25, desc: '可承受小幅波动，可配置理财、短债、保险等产品' },
  { level: 'R3', name: '平衡型', max: 35, desc: '追求风险收益平衡，可参与混合基金与黄金' },
  { level: 'R4', name: '成长型', max: 42, desc: '可承受较大波动，可配置指数基金与股票' },
  { level: 'R5', name: '进取型', max: 50, desc: '追求长期高回报，可配置全部风险等级产品' },
]
