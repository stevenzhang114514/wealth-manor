/**
 * 板块建筑配置（数据驱动）：随机生成连在一起的地图，每一步可能进入不同板块
 * cycleBias：经济周期对各板块景气度的加成（年化百分点）
 * items：板块内的掉落物（开箱所得），baseValue 为普通品质基础价值（金币）
 */
export const SECTORS = [
  {
    id: 'crops',
    name: '经济作物',
    icon: '🌾',
    color: '#4e8c4e',
    desc: '小麦、棉花、咖啡豆等农产品板块，复苏期景气',
    cycleBias: { expansion: 0.5, overheating: -0.5, recession: -0.5, recovery: 1.5 },
    items: [
      { id: 'wheat', name: '小麦', emoji: '🌾', baseValue: 80 },
      { id: 'cotton', name: '棉花', emoji: '☁️', baseValue: 90 },
      { id: 'coffee', name: '咖啡豆', emoji: '☕', baseValue: 120 },
      { id: 'fruit', name: '热带水果', emoji: '🍍', baseValue: 100 },
    ],
  },
  {
    id: 'grain',
    name: '粮油',
    icon: '🥜',
    color: '#c98f4e',
    desc: '大豆、玉米、油脂等民生刚需板块，抗衰退防御型',
    cycleBias: { expansion: 0.2, overheating: 0.5, recession: 0.8, recovery: 0.3 },
    items: [
      { id: 'soy', name: '大豆', emoji: '🫘', baseValue: 85 },
      { id: 'corn', name: '玉米', emoji: '🌽', baseValue: 75 },
      { id: 'oil', name: '菜籽油', emoji: '🛢️', baseValue: 95 },
      { id: 'rice', name: '大米', emoji: '🍚', baseValue: 70 },
    ],
  },
  {
    id: 'metal',
    name: '金属',
    icon: '⚙️',
    color: '#7d8a99',
    desc: '铜、铝、锂、稀土等工业金属板块，过热期景气（通胀受益）',
    cycleBias: { expansion: 1.0, overheating: 2.0, recession: -1.5, recovery: 0.8 },
    items: [
      { id: 'copper', name: '铜锭', emoji: '🟤', baseValue: 110 },
      { id: 'aluminum', name: '铝锭', emoji: '⚪', baseValue: 90 },
      { id: 'lithium', name: '锂矿', emoji: '🔋', baseValue: 150 },
      { id: 'rareearth', name: '稀土', emoji: '🧲', baseValue: 180 },
    ],
  },
  {
    id: 'oilgas',
    name: '油气',
    icon: '⛽',
    color: '#5b4a3a',
    desc: '原油、天然气等能源板块，扩张期景气、波动大',
    cycleBias: { expansion: 2.0, overheating: 1.0, recession: -2.0, recovery: 0.5 },
    items: [
      { id: 'crude', name: '原油桶', emoji: '🛢️', baseValue: 130 },
      { id: 'gas', name: '天然气', emoji: '💨', baseValue: 100 },
      { id: 'fuel', name: '燃料油', emoji: '🔥', baseValue: 95 },
      { id: 'petrochem', name: '石化产品', emoji: '🧪', baseValue: 140 },
    ],
  },
]
