/**
 * 植物物种配置（数据驱动：新增植物品种只需在此追加一条）
 * 设计映射：种子品类 ↔ 理财产品风险等级（见《设计方案》机制一）
 */

export const SPECIES = {
  sunflower: {
    name: '向日葵',
    emoji: '🌻',
    productCategory: '稳健型',
    plotType: 'garden',
    matureDays: 7,
    volatility: '低',
    color: '#F6C445',
    desc: '货基/存款类 · 7天开花',
  },
  tulip: {
    name: '郁金香',
    emoji: '🌷',
    productCategory: '稳健型',
    plotType: 'garden',
    matureDays: 14,
    volatility: '低',
    color: '#E87BA0',
    desc: '定期存款类 · 14天开花',
  },
  rose: {
    name: '玫瑰',
    emoji: '🌹',
    productCategory: '稳健型',
    plotType: 'garden',
    matureDays: 10,
    volatility: '低',
    color: '#E0524D',
    desc: '短债理财类 · 10天开花',
  },
  apple: {
    name: '苹果树',
    emoji: '🍎',
    productCategory: '进取型',
    plotType: 'orchard',
    matureDays: 30,
    volatility: '中',
    color: '#E0524D',
    desc: '指数基金类 · 30天结果',
  },
  orange: {
    name: '橙子树',
    emoji: '🍊',
    productCategory: '进取型',
    plotType: 'orchard',
    matureDays: 45,
    volatility: '中',
    color: '#F5A83D',
    desc: '债券/混合基金 · 45天结果',
  },
  grape: {
    name: '葡萄藤',
    emoji: '🍇',
    productCategory: '进取型',
    plotType: 'orchard',
    matureDays: 60,
    volatility: '高',
    color: '#8E7CC3',
    desc: '行业主题基金 · 60天结果',
  },
  oak: {
    name: '橡木',
    emoji: '🌳',
    productCategory: '长期型',
    plotType: 'greenhouse',
    matureDays: 180,
    volatility: '中',
    color: '#4E8C4E',
    desc: '养老/教育金 · 180天成材',
  },
  pine: {
    name: '雪松',
    emoji: '🌲',
    productCategory: '长期型',
    plotType: 'greenhouse',
    matureDays: 365,
    volatility: '低',
    color: '#3E7C5B',
    desc: '长期储蓄 · 365天成材',
  },
  hybrid: {
    name: '杂交花',
    emoji: '🌺',
    productCategory: '策略型',
    plotType: 'garden',
    matureDays: 90,
    volatility: '自定义',
    color: '#E05AA0',
    desc: '组合投顾 · 自定义周期',
  },
}

/** 生长阶段 → 展示形态（成熟时使用物种 emoji） */
export const STAGE_DISPLAY = {
  seed: { label: '种子', emoji: '🌰' },
  sprout: { label: '发芽', emoji: '🌱' },
  growing: { label: '生长', emoji: '🌿' },
  mature: { label: '成熟', emoji: null },
  wilted: { label: '枯萎', emoji: '🥀' },
}

export const PLOT_TYPES = {
  garden: { label: '花园', color: '#A8C686' },
  orchard: { label: '果园', color: '#8FB06B' },
  greenhouse: { label: '温室', color: '#9CC0C9' },
}
