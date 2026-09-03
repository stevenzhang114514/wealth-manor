/**
 * 容器（投资方式）配置（数据驱动）：开局 3 选 2，每步开箱前可切换
 * volFactor：开箱价值波动倍数（对接历史收益分布抽样的波动率）
 * critDelta：暴击概率修正（叠加难度基础暴击）
 * sideChance/sideRange：副收益一（金币小奖）概率与区间
 * upgradeChance：副收益二（掉落物品质升一档）概率
 * unlockRisk：风评解锁门槛
 */
export const CONTAINERS = [
  {
    id: 'stock',
    name: '股票',
    emoji: '📈',
    desc: '高波动高暴击：波动×1.5、暴击率+5%，风险与肾上腺素并存',
    volFactor: 1.5,
    critDelta: 0.05,
    sideChance: 0.08,
    sideRange: [5, 50],
    upgradeChance: 0.03,
    unlockRisk: 'R3',
  },
  {
    id: 'bond',
    name: '债券',
    emoji: '📜',
    desc: '稳定防御：波动×0.6、暴击率-5%，但副收益概率高达18%',
    volFactor: 0.6,
    critDelta: -0.05,
    sideChance: 0.18,
    sideRange: [5, 30],
    upgradeChance: 0.01,
    unlockRisk: 'R1',
  },
  {
    id: 'fund',
    name: '基金',
    emoji: '🪙',
    desc: '均衡之选：标准波动，副收益12%，兼顾收益与体验',
    volFactor: 1.0,
    critDelta: 0,
    sideChance: 0.12,
    sideRange: [5, 40],
    upgradeChance: 0.02,
    unlockRisk: 'R2',
  },
]
