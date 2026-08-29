/**
 * 财富人生模拟器引擎（业务逻辑层，纯函数可单测）
 * 回合制现金流经营：1回合=1个月
 *   结算上期收益 → 发薪与支出 → 随机事件（经济周期/政策/生活）→ 玩家决策(买卖) → 目标校验
 * 金融产品 = 英雄卡：风险/收益/流动性/法律·税收/到期日/特殊情况 七维属性
 */
import { PRODUCTS, RISK_RANK } from '../data/products.js'
import { RISK_QUESTIONS, RISK_LEVELS } from '../data/riskQuestions.js'
import { EVENTS } from '../data/events.js'
import { createSeededRandom, shuffle } from '../utils/random.js'

/* ---------- 风险评估 ---------- */

/** 答案映射为得分（answers: [{id, option}]） */
export function mapAnswersToScores(answers) {
  const qMap = new Map(RISK_QUESTIONS.map((q) => [q.id, q]))
  return answers
    .map((a) => qMap.get(a.id)?.options[a.option]?.score ?? 0)
    .filter((s) => s > 0)
}

/** 风评等级判定（纯函数）：总分 10~50 → R1~R5 */
export function scoreRiskAssessment(scores) {
  const total = scores.reduce((s, x) => s + x, 0)
  const lv = RISK_LEVELS.find((l) => total <= l.max) ?? RISK_LEVELS[RISK_LEVELS.length - 1]
  return { score: total, level: lv.level, levelName: lv.name, desc: lv.desc, maxScore: 50 }
}

/* ---------- 产品英雄卡资格 ---------- */

/** 可购资格：风评等级 + 起投门槛（纯函数） */
export function eligibleProducts(level, cash) {
  const rank = RISK_RANK[level] ?? 1
  return PRODUCTS.map((p) => {
    let lock = null
    if (RISK_RANK[p.riskLevel] > rank) {
      lock = { type: 'risk', reason: `需风评达 ${p.riskLevel}（您当前 ${level}）` }
    } else if (cash < p.minAmount) {
      lock = { type: 'money', reason: `起投 ¥${p.minAmount.toLocaleString('zh-CN')}，当前资金不足` }
    }
    return { ...p, liquidity: { ...p.liquidity }, econ: { ...p.econ }, lock }
  })
}

/* ---------- 经济周期 × 政策 收益率状态机 ---------- */

export const CYCLE_PARAMS = {
  expansion: { rate: 0.1, equity: 1.5, bond: -0.2, label: '扩张期' },
  overheating: { rate: 0.4, equity: 1.0, bond: -0.6, label: '过热期' },
  recession: { rate: -0.4, equity: -2.5, bond: 0.5, label: '衰退期' },
  recovery: { rate: -0.1, equity: 0.8, bond: 0.2, label: '复苏期' },
}

/** 产品当月收益率（%，纯函数）：基础收益 + 周期敏感 + 政策修正 */
export function monthlyReturn(product, econState) {
  const cycle = CYCLE_PARAMS[econState.cycle] ?? CYCLE_PARAMS.recovery
  const fx = econState.fx ?? {}
  const isAnnuity = product.id === 'p_annuity'
  let r =
    product.yieldBase / 12 +
    product.econ.rate * cycle.rate +
    product.econ.equity * cycle.equity +
    product.econ.bond * cycle.bond +
    (fx.rate ?? 0) * product.econ.rate +
    (fx.equity ?? 0) * product.econ.equity +
    (fx.bond ?? 0) * product.econ.bond
  if (isAnnuity && fx.annuity) r += fx.annuity
  return Math.max(-25, Math.min(15, r))
}

/* ---------- 会话创建 ---------- */

/** 创建会话：剧本初始化 + 确定性事件队列（纯函数，seed 可复现） */
export function createSession(scenario, riskLevel, seed = 20260813) {
  const rand = createSeededRandom(seed)
  const eventQueue = shuffle([...EVENTS], rand).map((e) => ({ ...e }))
  return {
    id: `s_${Date.now()}_${Math.floor(rand() * 10000)}`,
    scenarioId: scenario.id,
    riskLevel,
    turn: 0,
    startAge: scenario.startAge,
    age: scenario.startAge,
    totalTurns: scenario.totalTurns,
    cash: scenario.cash,
    income: scenario.monthlyIncome,
    expense: scenario.monthlyExpense,
    debt: scenario.debt ? { ...scenario.debt } : null,
    holdings: [],
    econState: { cycle: 'recovery', policy: 'none', policyTurns: 0, fx: null },
    goals: scenario.goals.map((g) => ({ ...g, done: false, missed: false })),
    eventQueue,
    log: [{ turn: 0, type: 'info', text: `欢迎进入「${scenario.name}」剧本，从第1个月开始经营你的财富人生` }],
    stats: { impulse: 0, liquidityWarn: 0, concentrationWarn: 0, policyMiss: 0 },
    gameOver: null,
    lastEvent: null,
    lastSettlement: [],
  }
}

/* ---------- 回合推进 ---------- */

/** 现金流与流动性口径：现金 + T+0/T+1 产品 + 已到期锁定产品 */
export function liquidAssets(session) {
  let liquid = session.cash
  for (const h of session.holdings) {
    const p = PRODUCTS.find((x) => x.id === h.productId)
    if (!p) continue
    const matured = p.termMonths ? session.turn - h.purchaseTurn >= p.termMonths : false
    if (p.liquidity.type !== 'locked' || matured) liquid += h.amount
  }
  return Math.round(liquid)
}

/** 净资产 = 现金 + 全部持仓市值 - 负债 */
export function netWorth(session) {
  const holdingsValue = session.holdings.reduce((s, h) => s + h.amount, 0)
  const debt = session.debt ? session.debt.balance : 0
  return Math.round(session.cash + holdingsValue - debt)
}

/**
 * 回合推进（纯函数，返回新会话副本）：
 * decision = { buys: [{productId, amount}], redeems: [{index, amount}] }
 */
export function advanceTurn(sessionInput, decision = {}) {
  const s = structuredClone(sessionInput)
  if (s.gameOver) return s
  const buys = decision.buys ?? []
  const redeems = decision.redeems ?? []

  // 1. 结算上期收益（按当月经济环境计息，复利留存持仓内）
  s.lastSettlement = s.holdings.map((h) => {
    const p = PRODUCTS.find((x) => x.id === h.productId)
    const r = p ? monthlyReturn(p, s.econState) : 0
    const gain = (h.amount * r) / 100
    h.amount += gain
    h.lastReturn = +r.toFixed(2)
    return { productId: h.productId, name: p?.name ?? h.productId, emoji: p?.emoji ?? '📦', rate: +r.toFixed(2), gain: Math.round(gain) }
  })

  // 2. 发薪与支出
  s.cash += s.income
  s.cash -= s.expense
  if (s.debt) {
    s.cash -= s.debt.monthly
    s.debt.balance = Math.max(0, s.debt.balance - s.debt.monthly * 0.7)
  }

  // 3. 随机事件（确定性队列；政策持续性递减）
  if (s.econState.policyTurns > 0) {
    s.econState.policyTurns -= 1
    if (s.econState.policyTurns <= 0) {
      s.econState.policy = 'none'
      s.econState.fx = null
    }
  }
  const event = s.eventQueue[s.turn % s.eventQueue.length]
  s.lastEvent = { ...event }
  s.log.push({ turn: s.turn + 1, type: event.type, text: `【${event.icon}${event.title}】${event.desc}` })
  const fx = event.effects ?? {}
  if (fx.cycle) s.econState.cycle = fx.cycle
  if (fx.policy) {
    s.econState.policy = fx.policy
    s.econState.policyTurns = fx.turns ?? 1
    s.econState.fx = fx.fx ?? null
    if (buys.length === 0) s.stats.policyMiss += 1
  }
  if (fx.cash) {
    s.cash += fx.cash
    s.log.push({ turn: s.turn + 1, type: 'cash', text: `现金 ${fx.cash > 0 ? '+' : ''}¥${fx.cash.toLocaleString('zh-CN')}` })
  }
  if (fx.incomePct) {
    s.income = Math.round(s.income * (1 + fx.incomePct))
    s.log.push({ turn: s.turn + 1, type: 'income', text: `月收入调整至 ¥${s.income.toLocaleString('zh-CN')}` })
  }
  if (fx.expensePct) {
    s.expense = Math.round(s.expense * (1 + fx.expensePct))
    s.log.push({ turn: s.turn + 1, type: 'expense', text: `月支出调整至 ¥${s.expense.toLocaleString('zh-CN')}` })
  }
  if (fx.fx?.debt && s.debt) {
    s.debt.monthly = Math.round(s.debt.monthly * (1 + fx.fx.debt))
    s.log.push({ turn: s.turn + 1, type: 'debt', text: `房贷月供调整至 ¥${s.debt.monthly.toLocaleString('zh-CN')}` })
  }

  // 4. 玩家决策：购买
  const monthlySurplus = s.income - s.expense
  for (const b of buys) {
    const p = PRODUCTS.find((x) => x.id === b.productId)
    if (!p || !Number.isFinite(b.amount) || b.amount <= 0) continue
    const eligible = eligibleProducts(s.riskLevel, s.cash).find((x) => x.id === b.productId)
    if (eligible?.lock) continue
    if (b.amount > s.cash) continue
    if (b.amount > monthlySurplus * 0.6) s.stats.impulse += 1
    s.cash -= b.amount
    const exist = s.holdings.find((h) => h.productId === b.productId)
    if (exist) {
      exist.amount += b.amount
      exist.purchaseTurn = s.turn + 1
    } else {
      s.holdings.push({ productId: b.productId, amount: b.amount, purchaseTurn: s.turn + 1, lastReturn: 0 })
    }
    s.log.push({ turn: s.turn + 1, type: 'buy', text: `买入「${p.emoji}${p.name}」¥${b.amount.toLocaleString('zh-CN')}` })
  }

  // 5. 玩家决策：赎回（含提前赎回规则）
  for (const rd of redeems) {
    const h = s.holdings[rd.index]
    if (!h) continue
    const p = PRODUCTS.find((x) => x.id === h.productId)
    const amount = Math.min(rd.amount ?? h.amount, h.amount)
    if (amount <= 0) continue
    const heldMonths = s.turn + 1 - h.purchaseTurn
    const matured = p.termMonths ? heldMonths >= p.termMonths : true
    let value = amount
    let warn = null
    if (!matured && p.earlyRedeem) {
      if (p.earlyRedeem.type === 'forbidden') {
        s.log.push({ turn: s.turn + 1, type: 'warn', text: `「${p.name}」封闭期内不可赎回` })
        continue
      }
      if (p.earlyRedeem.type === 'demand-rate') value = amount * (1 + (0.2 / 1200) * heldMonths)
      if (p.earlyRedeem.type === 'fee') value = amount * 0.995
      if (p.earlyRedeem.type === 'surrender') value = amount * 0.85
      warn = `提前赎回「${p.name}」：${p.earlyRedeem.desc}`
    }
    s.cash += value
    h.amount -= amount
    if (h.amount < 1) s.holdings.splice(rd.index, 1)
    s.log.push({ turn: s.turn + 1, type: 'redeem', text: `赎回「${p.name}」¥${Math.round(value).toLocaleString('zh-CN')}${warn ? `（${warn}）` : ''}` })
  }

  // 6. 回合推进与年龄（每12回合长一岁）
  s.turn += 1
  s.age = s.startAge + Math.floor((s.turn - 1) / 12)

  // 7. 流动性危机判定（现金断流 / 应急不足）
  const liquid = liquidAssets(s)
  if (s.cash < 0) {
    s.gameOver = 'liquidity'
    s.log.push({ turn: s.turn, type: 'fail', text: '现金断流！家庭陷入流动性危机，模拟结束——请重视应急储备' })
  } else if (liquid < s.expense * 0.5) {
    s.stats.liquidityWarn += 1
    s.log.push({ turn: s.turn, type: 'warn', text: '⚠️ 可动用资金不足半月支出，流动性告急' })
  }

  // 8. 集中度风险监测
  const totalAssets = s.cash + s.holdings.reduce((sum, h) => sum + h.amount, 0)
  const maxHolding = Math.max(0, ...s.holdings.map((h) => h.amount))
  if (totalAssets > 0 && maxHolding / totalAssets > 0.6) {
    s.stats.concentrationWarn += 1
  }

  // 9. 目标校验（可提前达成；到期未达则标记 missed）
  for (const g of s.goals) {
    if (g.done || g.missed) continue
    if (s.turn === g.turn) {
      if (liquid >= g.targetAmount) {
        g.done = true
        s.log.push({ turn: s.turn, type: 'goal', text: `🎯 目标「${g.label}」达成！可用资金 ¥${liquid.toLocaleString('zh-CN')}` })
      } else {
        g.missed = true
        s.log.push({ turn: s.turn, type: 'fail', text: `❌ 目标「${g.label}」未达成（需求 ¥${g.targetAmount.toLocaleString('zh-CN')}，可用 ¥${liquid.toLocaleString('zh-CN')}）` })
      }
    }
  }

  // 10. 终局判定
  if (s.turn > s.totalTurns) {
    s.gameOver = 'complete'
  }
  return s
}

/* ---------- 复盘护照 ---------- */

/** 财富偏差护照（四维复盘，纯函数） */
export function buildPassport(session) {
  const dims = [
    {
      key: 'impulse',
      label: '冲动消费',
      desc: '单次投入超过当月结余60%的购买行为会被记为冲动决策。',
      count: session.stats.impulse,
      level: session.stats.impulse >= 3 ? 2 : session.stats.impulse >= 1 ? 1 : 0,
    },
    {
      key: 'liquidity',
      label: '流动性不足',
      desc: '可动用资金低于半月支出即触发流动性警告。',
      count: session.stats.liquidityWarn,
      level: session.stats.liquidityWarn >= 3 ? 2 : session.stats.liquidityWarn >= 1 ? 1 : 0,
    },
    {
      key: 'concentration',
      label: '集中度过高',
      desc: '单一产品占家庭资产超过60%即触发集中度警告（鸡蛋不要放在一个篮子里）。',
      count: session.stats.concentrationWarn,
      level: session.stats.concentrationWarn >= 3 ? 2 : session.stats.concentrationWarn >= 1 ? 1 : 0,
    },
    {
      key: 'policy',
      label: '错过政策窗口',
      desc: '政策事件当回合未做任何配置，记为错过一次政策窗口。',
      count: session.stats.policyMiss,
      level: session.stats.policyMiss >= 3 ? 2 : session.stats.policyMiss >= 1 ? 1 : 0,
    },
  ]
  const totalLevel = dims.reduce((s, d) => s + d.level, 0)
  const grade = totalLevel === 0 ? 'S · 财富大师' : totalLevel <= 2 ? 'A · 稳健管家' : totalLevel <= 5 ? 'B · 有待修炼' : 'C · 财富小白'
  return { dims, grade }
}
