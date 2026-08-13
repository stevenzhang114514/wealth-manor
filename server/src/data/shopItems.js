/**
 * 商城商品配置（数据驱动：新增商品只需在此追加一条）
 * category: decoration 装饰（带场景摆件位置 slot）/ skin 庄园皮肤 / title 称号
 * price: { coins } 或 { diamonds }，荣誉点商品后续接入真实理财行为数据
 * rarity: normal 普通 / rare 稀有 / epic 史诗 / legend 传说
 */

export const SHOP_CATEGORY_LABELS = {
  decoration: '装饰',
  skin: '皮肤',
  title: '称号',
}

export const SHOP_ITEMS = [
  // —— 装饰（equipped 后渲染到庄园场景 slot 位置）——
  {
    id: 's_deco_fountain',
    category: 'decoration',
    name: '好运喷泉',
    emoji: '⛲',
    rarity: 'rare',
    price: { coins: 120 },
    desc: '每日第一次浇水额外 +3 金币（寓意）',
    slot: { x: 320, y: 138 },
  },
  {
    id: 's_deco_windmill',
    category: 'decoration',
    name: '金色风车',
    emoji: '🎡',
    rarity: 'epic',
    price: { diamonds: 2 },
    desc: '随风转动，带来好运',
    slot: { x: 40, y: 132 },
  },
  {
    id: 's_deco_swing',
    category: 'decoration',
    name: '花间秋千',
    emoji: '🛝',
    rarity: 'rare',
    price: { coins: 160 },
    desc: '午后小憩的好去处',
    slot: { x: 78, y: 150 },
  },
  {
    id: 's_deco_lantern',
    category: 'decoration',
    name: '星光路灯',
    emoji: '🏮',
    rarity: 'normal',
    price: { coins: 60 },
    desc: '点亮庄园的夜晚',
    slot: { x: 246, y: 120 },
  },
  {
    id: 's_deco_statue',
    category: 'decoration',
    name: '财富守护狮',
    emoji: '🦁',
    rarity: 'legend',
    price: { diamonds: 5 },
    desc: '镇守财富，只赚不亏（寓意）',
    slot: { x: 292, y: 165 },
  },
  // —— 皮肤（庄园整体风格）——
  {
    id: 's_skin_zhongshi',
    category: 'skin',
    name: '中式青砖院墙',
    emoji: '🏯',
    rarity: 'rare',
    price: { coins: 200 },
    desc: '青砖黛瓦，古典韵味',
    slot: null,
  },
  {
    id: 's_skin_xishi',
    category: 'skin',
    name: '西式花园城堡',
    emoji: '🏰',
    rarity: 'epic',
    price: { diamonds: 3 },
    desc: '浪漫城堡，梦幻花园',
    slot: null,
  },
  {
    id: 's_skin_shi',
    category: 'skin',
    name: '日式禅意庭院',
    emoji: '⛩️',
    rarity: 'rare',
    price: { coins: 220 },
    desc: '枯山水，静心养财',
    slot: null,
  },
  // —— 称号（庄园名片展示）——
  {
    id: 's_title_newstar',
    category: 'title',
    name: '理财新星',
    emoji: '⭐',
    rarity: 'normal',
    price: { coins: 80 },
    desc: '迈出理财第一步',
    slot: null,
  },
  {
    id: 's_title_manor',
    category: 'title',
    name: '庄园主',
    emoji: '👑',
    rarity: 'rare',
    price: { coins: 150 },
    desc: '经营有方，庄园兴旺',
    slot: null,
  },
  {
    id: 's_title_knight',
    category: 'title',
    name: '财富骑士',
    emoji: '🛡️',
    rarity: 'legend',
    price: { diamonds: 4 },
    desc: '守护家庭财富的骑士',
    slot: null,
  },
]

export const RARITY_LABELS = {
  normal: '普通',
  rare: '稀有',
  epic: '史诗',
  legend: '传说',
}
