/**
 * 夺金冒险局难度配置（数据驱动）
 * 收益以"游戏金币"计，100金币 = 1元现实收入（换算展示用）
 */
export const DIFFICULTIES = [
  {
    id: 'easy',
    timeLimit: 90, // 秒
    name: '简单',
    icon: '🌱',
    desc: '新手保护局：前3回合不会遭遇黑天鹅，安心体验摸金节奏',
    startGold: 1000,
    targetMultiple: 1.5,
    maxTurns: 30,
    blackSwanPct: 0.05,
    critRange: [1.5, 2],
    rankFactor: 1,
    noviceProtect: 3,
  },
  {
    id: 'normal',
    timeLimit: 75, // 秒
    name: '普通',
    icon: '⚔️',
    desc: '标准摸金局：黑天鹅概率 12%，暴击最高 ×2',
    startGold: 1000,
    targetMultiple: 2,
    maxTurns: 25,
    blackSwanPct: 0.12,
    critRange: [1.5, 2],
    rankFactor: 1.5,
    noviceProtect: 0,
  },
  {
    id: 'hard',
    timeLimit: 60, // 秒
    name: '困难',
    icon: '🔥',
    desc: '高波动局：黑天鹅概率 20%，暴击最高 ×2.5，收益与风险并存',
    startGold: 1000,
    targetMultiple: 3,
    maxTurns: 20,
    blackSwanPct: 0.2,
    critRange: [1.5, 2.5],
    rankFactor: 2,
    noviceProtect: 0,
  },
  {
    id: 'nightmare',
    timeLimit: 45, // 秒
    name: '噩梦',
    icon: '💀',
    desc: '极限摸金：黑天鹅概率 30%，暴击最高 ×3，一步天堂一步深渊',
    startGold: 1000,
    targetMultiple: 5,
    maxTurns: 15,
    blackSwanPct: 0.3,
    critRange: [1.5, 3],
    rankFactor: 3,
    noviceProtect: 0,
  },
]

/** 段位（按累计排位分） */
export const RANKS = [
  { tier: 'bronze', name: '青铜', icon: '🥉', min: 0 },
  { tier: 'silver', name: '白银', icon: '🥈', min: 100 },
  { tier: 'gold', name: '黄金', icon: '🥇', min: 300 },
  { tier: 'platinum', name: '铂金', icon: '💎', min: 700 },
  { tier: 'diamond', name: '钻石', icon: '👑', min: 1500 },
  { tier: 'king', name: '王者', icon: '🏆', min: 3000 },
]

/** 金币↔现实 换算比例：100金币 = 1元 */
export const GOLD_TO_CNY = 100
