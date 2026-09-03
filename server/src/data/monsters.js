/**
 * 地牢怪物 = 金融风险事件化身（数据驱动）
 * 遭遇后三选博弈：fight 迎战（随机损失 roll，看运气）/ defend 防御（固定小损+耗时惩罚）
 *   / flee 逃离（无损但白耗行动）
 * desc 为教育性描述：这是哪种金融风险
 */
export const MONSTERS = [
  {
    id: 'm_crash',
    name: '股灾妖',
    icon: '🦢',
    desc: '黑天鹅化身：市场恐慌性抛售导致权益类资产大幅回撤——你持有的高风险资产首当其冲',
    lossRange: [0.08, 0.18],
    fightEscape: 0.1, // 迎战时 10% 概率侥幸躲过（损失0）
  },
  {
    id: 'm_bondbeast',
    name: '债魔',
    icon: '📉',
    desc: '信用暴雷化身：所持债券发行方违约，本金受损——高收益债的风险开始兑现',
    lossRange: [0.05, 0.14],
    fightEscape: 0.12,
  },
  {
    id: 'm_liquidity',
    name: '流动性魔',
    icon: '🧊',
    desc: '流动性冻结化身：市场骤冷无法变现，急需现金时只能折价抛售',
    lossRange: [0.04, 0.12],
    fightEscape: 0.15,
  },
  {
    id: 'm_inflation',
    name: '通胀巨兽',
    icon: '🎈',
    desc: '购买力吞噬者：物价上涨让现金悄悄缩水——持有现金也是风险',
    lossRange: [0.02, 0.08],
    fightEscape: 0.2,
  },
  {
    id: 'm_frenzy',
    name: '狂热幽灵',
    icon: '👻',
    desc: '追涨杀跌化身：市场情绪过热时高位接盘，情绪是最好的韭菜收割机',
    lossRange: [0.06, 0.15],
    fightEscape: 0.1,
  },
  {
    id: 'm_shock',
    name: '雷之冲击',
    icon: '⚡',
    desc: '突发事件化身：政策或地缘突变冲击市场，短时间剧烈波动',
    lossRange: [0.03, 0.1],
    fightEscape: 0.18,
  },
]
