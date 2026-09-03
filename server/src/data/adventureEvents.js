/**
 * 夺金冒险局事件池（数据驱动）
 * type: opportunity 摸金机会（利好，均值上调）/ blackswan 黑天鹅（利空，均值下调或资产受损）/ neutral 中性
 * effect: { cycle?, productFilter?, meanShift?, cashChange?, allLossPct? }
 */
export const ADVENTURE_EVENTS = [
  // ---------- 摸金机会 ----------
  {
    id: 'ae_bull',
    type: 'opportunity',
    icon: '🐂',
    title: '牛市行情启动',
    desc: '市场情绪高涨，权益类资产进入上行通道！',
    effect: { cycle: 'expansion', productFilter: 'equity', meanShift: 3 },
  },
  {
    id: 'ae_dip',
    type: 'opportunity',
    icon: '🎯',
    title: '低位建仓机会',
    desc: '优质资产出现黄金坑，逆向布局窗口打开。',
    effect: { productFilter: 'equity', meanShift: 2.5 },
  },
  {
    id: 'ae_redpacket',
    type: 'opportunity',
    icon: '🧧',
    title: '政策红包',
    desc: '降准降息预期升温，债券与存款类资产受益。',
    effect: { cycle: 'recovery', productFilter: 'fixed', meanShift: 2 },
  },
  {
    id: 'ae_bonus',
    type: 'opportunity',
    icon: '💼',
    title: '年终奖到账',
    desc: '一笔意外之财到账，摸金本金+200金币！',
    effect: { cashChange: 200 },
  },
  // ---------- 黑天鹅 ----------
  {
    id: 'ae_crash',
    type: 'blackswan',
    icon: '🦢',
    title: '黑天鹅：股市闪崩',
    desc: '突发事件引发恐慌抛售，权益类资产大幅回撤！',
    effect: { cycle: 'recession', productFilter: 'equity', meanShift: -5 },
  },
  {
    id: 'ae_bondcrash',
    type: 'blackswan',
    icon: '📉',
    title: '债券暴雷传闻',
    desc: '信用事件发酵，债券类资产遭遇抛压。',
    effect: { productFilter: 'fixed', meanShift: -3 },
  },
  {
    id: 'ae_freeze',
    type: 'blackswan',
    icon: '🧊',
    title: '流动性冻结',
    desc: '短期流动性枯竭，所有资产估值承压。',
    effect: { meanShift: -2 },
  },
  {
    id: 'ae_medical',
    type: 'blackswan',
    icon: '🏥',
    title: '突发医疗支出',
    desc: '紧急支出 -300 金币——现金流安全垫的重要性！',
    effect: { cashChange: -300 },
  },
  // ---------- 中性 ----------
  {
    id: 'ae_salary',
    type: 'neutral',
    icon: '💰',
    title: '工资到账',
    desc: '本月工资入账，摸金本金+100金币。',
    effect: { cashChange: 100 },
  },
  {
    id: 'ae_inflation',
    type: 'neutral',
    icon: '🎈',
    title: '通胀温和上行',
    desc: '物价小幅上涨，现金购买力悄悄缩水。',
    effect: { meanShift: 0.5, note: '持有现金也并非零风险' },
  },
]

/** 产品分类过滤器（匹配 econ 敏感度） */
export const PRODUCT_GROUPS = {
  equity: ['p_mixed', 'p_etf', 'p_stock'],
  fixed: ['p_fixed1y', 'p_cd', 'p_tbond', 'p_shortbond', 'p_wm2', 'p_insurance', 'p_annuity'],
}
