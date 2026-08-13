/**
 * 好友与排行榜模拟数据（数据驱动）
 * score：月度资产配置合理性评分（0-100，由 AI 评估生成，Mock 静态）
 */

export const FRIENDS = [
  {
    id: 'f_001',
    name: '李晓雅',
    avatar: '👩',
    manorName: '雅苑小筑',
    level: 12,
    score: 92,
    online: true,
    bio: '定投第366天',
    plants: [
      { species: 'sunflower', stage: 'mature', emoji: '🌻' },
      { species: 'apple', stage: 'growing', emoji: '🌿' },
      { species: 'oak', stage: 'sprout', emoji: '🌱' },
    ],
  },
  {
    id: 'f_002',
    name: '王浩然',
    avatar: '👨',
    manorName: '浩然农场',
    level: 9,
    score: 85,
    online: true,
    bio: '权益类打工人',
    plants: [
      { species: 'apple', stage: 'mature', emoji: '🍎' },
      { species: 'grape', stage: 'growing', emoji: '🌿' },
    ],
  },
  {
    id: 'f_003',
    name: '陈思远',
    avatar: '🧑',
    manorName: '远见庄园',
    level: 15,
    score: 95,
    online: false,
    bio: '养老规划先行者',
    plants: [
      { species: 'oak', stage: 'growing', emoji: '🌿' },
      { species: 'pine', stage: 'sprout', emoji: '🌱' },
      { species: 'sunflower', stage: 'mature', emoji: '🌻' },
    ],
  },
  {
    id: 'f_004',
    name: '赵雨桐',
    avatar: '👧',
    manorName: '雨桐花园',
    level: 6,
    score: 71,
    online: true,
    bio: '理财新手学习中',
    plants: [
      { species: 'tulip', stage: 'sprout', emoji: '🌱' },
      { species: 'sunflower', stage: 'seed', emoji: '🌰' },
    ],
  },
  {
    id: 'f_005',
    name: '刘子墨',
    avatar: '👦',
    manorName: '墨香小院',
    level: 11,
    score: 88,
    online: false,
    bio: '稳健配置，静待花开',
    plants: [
      { species: 'orange', stage: 'mature', emoji: '🍊' },
      { species: 'rose', stage: 'growing', emoji: '🌿' },
    ],
  },
]

/** 排行榜（含演示用户本人，rank 由服务层插入计算） */
export const LEADERBOARD = [
  { id: 'lb_001', name: '林沐宸', avatar: '🧑‍💼', manorName: '宸光庄园', level: 18, score: 98 },
  { id: 'lb_002', name: '苏婉清', avatar: '👩‍💼', manorName: '清岚小筑', level: 17, score: 97 },
  { id: 'lb_003', name: '陈思远', avatar: '🧑', manorName: '远见庄园', level: 15, score: 95 },
  { id: 'lb_004', name: '周明轩', avatar: '👨‍🎓', manorName: '明轩农场', level: 14, score: 93 },
  { id: 'lb_005', name: '李晓雅', avatar: '👩', manorName: '雅苑小筑', level: 12, score: 92 },
  { id: 'lb_006', name: '吴桐', avatar: '👩‍🌾', manorName: '梧桐庄园', level: 13, score: 90 },
  { id: 'lb_007', name: '刘子墨', avatar: '👦', manorName: '墨香小院', level: 11, score: 88 },
  { id: 'lb_008', name: '王浩然', avatar: '👨', manorName: '浩然农场', level: 9, score: 85 },
  { id: 'lb_009', name: '郑一诺', avatar: '👨‍💻', manorName: '一诺小院', level: 8, score: 79 },
  { id: 'lb_010', name: '赵雨桐', avatar: '👧', manorName: '雨桐花园', level: 6, score: 71 },
]

/** 演示用户本人的月度评分（由资产配置合理性与健康度 Mock 得出） */
export const SELF_SCORE = 82
