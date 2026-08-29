/**
 * 模拟器事件卡（数据驱动）：经济周期 / 政策变化 / 生活事件 三类
 * effects 字段说明：
 *   cycle        → 直接切换经济周期（扩张/过热/衰退/复苏）
 *   policy       → 政策环境（easing宽松/tightening紧缩/tax_benefit税优），turns 为持续回合
 *   fx           → 政策对月度收益的修正 {rate, equity, bond, annuity}
 *   cash / income / expense → 一次性或永久性资金变动
 */
export const EVENTS = [
  // ---------- 经济周期事件 ----------
  {
    id: 'e_bull',
    type: 'econ',
    title: '股市牛市开启',
    desc: '政策暖风频吹，市场情绪高涨，权益类资产进入上行通道。',
    effects: { cycle: 'expansion' },
    icon: '🐂',
  },
  {
    id: 'e_overheat',
    type: 'econ',
    title: '经济过热预警',
    desc: '物价上涨压力增大，央行开始收紧货币，警惕资产泡沫。',
    effects: { cycle: 'overheating' },
    icon: '🔥',
  },
  {
    id: 'e_recession',
    type: 'econ',
    title: '经济进入衰退',
    desc: '增长放缓，股市承压下跌，避险资产（国债/黄金）受到青睐。',
    effects: { cycle: 'recession' },
    icon: '📉',
  },
  {
    id: 'e_recovery',
    type: 'econ',
    title: '经济复苏迹象',
    desc: '数据企稳回升，市场信心修复，权益资产逐步回暖。',
    effects: { cycle: 'recovery' },
    icon: '🌅',
  },
  // ---------- 政策事件 ----------
  {
    id: 'e_rate_cut',
    type: 'policy',
    title: '央行降息25BP',
    desc: '基准利率下调：存款与货基收益下降，债券价格上涨。',
    effects: { policy: 'easing', turns: 6, fx: { rate: -0.4, bond: 0.7 } },
    icon: '🏦',
  },
  {
    id: 'e_rate_hike',
    type: 'policy',
    title: '央行加息25BP',
    desc: '基准利率上调：存款收益上升，债券价格承压。',
    effects: { policy: 'tightening', turns: 6, fx: { rate: 0.4, bond: -0.8 } },
    icon: '📊',
  },
  {
    id: 'e_stamp',
    type: 'policy',
    title: '印花税下调',
    desc: '股票交易印花税减半，交易成本降低，股市短期提振。',
    effects: { policy: 'stamp_cut', turns: 3, fx: { equity: 0.5 } },
    icon: '📄',
  },
  {
    id: 'e_annuity_tax',
    type: 'policy',
    title: '养老金税优政策落地',
    desc: '个人养老金账户个税递延，养老年金产品吸引力提升。',
    effects: { policy: 'tax_benefit', turns: 12, fx: { annuity: 0.4 } },
    icon: '🧾',
  },
  {
    id: 'e_deposit_insurance',
    type: 'policy',
    title: '存款保险知识普及',
    desc: '宣传月提醒：单家银行50万元以内存款受存款保险保障，无需过度分散。',
    effects: { cash: 0 },
    icon: '🛡️',
  },
  {
    id: 'e_lpr',
    type: 'policy',
    title: 'LPR报价下调',
    desc: '房贷利率随LPR下调，每月月供减少约3%（如有房贷）。',
    effects: { policy: 'lpr_cut', turns: 24, fx: { debt: -0.03 } },
    icon: '🏠',
  },
  // ---------- 生活事件 ----------
  {
    id: 'e_raise',
    type: 'life',
    title: '升职加薪',
    desc: '工作表现优异获得晋升，月收入永久性增加10%。',
    effects: { incomePct: 0.1 },
    icon: '🎉',
  },
  {
    id: 'e_bonus',
    type: 'life',
    title: '年终奖到账',
    desc: '公司发放年终奖，一次性到账一笔现金。',
    effects: { cash: 10000 },
    icon: '🧧',
  },
  {
    id: 'e_medical',
    type: 'life',
    title: '突发医疗支出',
    desc: '家人生病住院，需要一次性支付一笔医疗费用——应急储备的重要性！',
    effects: { cash: -8000 },
    icon: '🏥',
  },
  {
    id: 'e_baby',
    type: 'life',
    title: '宝宝出生',
    desc: '家庭迎来新成员！月支出永久性增加，责任与动力并存。',
    effects: { expensePct: 0.15 },
    icon: '👶',
  },
  {
    id: 'e_friend_loan',
    type: 'life',
    title: '好友借钱周转',
    desc: '好友开口借钱：借出会占用流动性，拒绝则可能影响关系（资金安全的权衡）。',
    effects: { cash: -3000, note: '借款3个月后归还' },
    icon: '🤝',
  },
  {
    id: 'e_promotion',
    type: 'life',
    title: '购物节大促',
    desc: '满屏折扣诱惑！冲动消费将消耗本月结余。',
    effects: { cash: -2000, note: '考验消费定力' },
    icon: '🛍️',
  },
]
