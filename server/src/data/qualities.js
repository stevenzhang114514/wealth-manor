/**
 * 开箱品质掉落表（数据驱动）：更高品质更值钱，但概率更低
 * probability 为累计概率区间（roll 用）
 */
export const QUALITIES = [
  { id: 'common', name: '普通', emoji: '⚪', color: '#9aa0a6', multiplier: 1, probability: 0.7 },
  { id: 'fine', name: '良品', emoji: '🟢', color: '#34c759', multiplier: 2, probability: 0.2 },
  { id: 'rare', name: '稀有', emoji: '🔵', color: '#007aff', multiplier: 4, probability: 0.08 },
  { id: 'epic', name: '珍品', emoji: '🟣', color: '#af52de', multiplier: 8, probability: 0.018 },
  { id: 'legend', name: '传说', emoji: '🟡', color: '#ffcc00', multiplier: 20, probability: 0.002 },
]
