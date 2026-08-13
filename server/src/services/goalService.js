/**
 * 场景化理财规划服务（业务逻辑层）
 * 演示口径：年化 4%（月利率 r=4%/12），复利公式 FV = PMT·((1+r)^n − 1)/r
 * 【扩展点】生产环境接入真实产品库与精算模型，公式与参数由 AI 引擎动态调整
 */
import { getProvider } from '../providers/index.js'
import { ERROR_CODES } from '../utils/response.js'

const provider = await getProvider('goal')

const ANNUAL_RATE = 0.04
const MONTHLY_RATE = ANNUAL_RATE / 12

const round = (v) => Math.round(v)

/** 等额定投月供（纯函数）：达到 target 所需每月投入 */
export function annuityPayment(target, months) {
  if (months <= 0) return target
  const fv = Math.pow(1 + MONTHLY_RATE, months)
  return (target * MONTHLY_RATE) / (fv - 1)
}

/** 购房规划（纯函数） */
export function calcHomePlan({ price, downPaymentPct = 30, years = 5 }) {
  const target = (price * downPaymentPct) / 100
  const months = Math.max(1, Math.round(years * 12))
  const monthly = annuityPayment(target, months)
  return {
    goalType: 'home',
    label: '购房首付',
    targetAmount: round(target),
    monthlyNeed: round(monthly),
    durationMonths: months,
    suggestion:
      monthly > 15000
        ? '目标偏激进：建议适当延长购房时间，或提高首付积累期的收入留存比例'
        : '节奏合理：坚持按月储蓄，可搭配稳健理财组合提升积累效率',
    products: ['稳健理财组合', '大额存单', '指数基金定投'],
  }
}

/** 教育规划（纯函数） */
export function calcEduPlan({ childAge, targetAmount, universityAge = 18 }) {
  const years = Math.max(1, universityAge - childAge)
  const months = years * 12
  const monthly = annuityPayment(targetAmount, months)
  return {
    goalType: 'education',
    label: '教育金',
    targetAmount: round(targetAmount),
    monthlyNeed: round(monthly),
    durationMonths: months,
    suggestion:
      monthly > 8000
        ? '教育金缺口较大：建议尽早启动，教育金产品复利效应显著'
        : '可按计划稳步投入，建议选择教育金保险或基金定投锁定长期复利',
    products: ['教育金保险', '指数基金定投', '稳健理财组合'],
  }
}

/** 养老规划（纯函数）：测算退休时所需资金池与当前起的月投入 */
export function calcRetirePlan({ currentAge = 28, retireAge = 60, monthlyIncome = 5000, expectedYears = 25 }) {
  const years = Math.max(1, retireAge - currentAge)
  const months = years * 12
  const target = monthlyIncome * 12 * expectedYears
  const monthly = annuityPayment(target, months)
  return {
    goalType: 'retirement',
    label: '养老补充',
    targetAmount: round(target),
    monthlyNeed: round(monthly),
    durationMonths: months,
    suggestion:
      years < 15
        ? '养老准备时间偏短：建议提高月投入或降低退休后补充目标'
        : '时间站在您这边：越早开始，复利空间越大，建议立即启动养老定投',
    products: ['养老目标基金(FOF)', '年金保险', '指数基金定投'],
  }
}

/** 应急储备（纯函数）：保留3~6个月支出 */
export function calcEmergency({ monthlyExpense }) {
  return {
    goalType: 'emergency',
    label: '应急储备',
    reserveMin: round(monthlyExpense * 3),
    reserveMax: round(monthlyExpense * 6),
    suggestion:
      '应急资金应放在活期或货币基金等流动性好的产品中，随时可取、不承担波动',
    products: ['货币基金', '活期存款', '短债理财'],
  }
}

const CALCULATORS = {
  home: { fn: calcHomePlan, required: ['price'] },
  education: { fn: calcEduPlan, required: ['childAge', 'targetAmount'] },
  retirement: { fn: calcRetirePlan, required: ['monthlyIncome'] },
  emergency: { fn: calcEmergency, required: ['monthlyExpense'] },
}

/** 目标测算：参数校验 → 计算 → 可选保存 */
export async function planGoal(payload) {
  const { goalType, params = {}, save = false } = payload ?? {}
  const calc = CALCULATORS[goalType]
  if (!calc) {
    return { error: { code: ERROR_CODES.BAD_REQUEST, message: 'goalType 仅支持 home/education/retirement/emergency' } }
  }
  for (const key of calc.required) {
    const v = Number(params[key])
    if (!Number.isFinite(v) || v <= 0) {
      return { error: { code: ERROR_CODES.BAD_REQUEST, message: `参数 ${key} 需为正数` } }
    }
  }
  const plan = calc.fn(params)
  if (save) {
    const goal = provider.saveGoal({ goalType, label: plan.label, params, plan })
    return { data: { goal, plan } }
  }
  return { data: { plan } }
}

/** 已保存的目标列表 */
export async function goals() {
  return provider.getGoals()
}
