/**
 * 纯逻辑单元测试（node:test 内置测试框架，零依赖）
 * 运行：npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcGrowthStage, enrichPlant } from './manorService.js'
import { gradeAnswers } from './quizService.js'
import { scorePortfolio } from './assetService.js'

const DAY = 86400000
const NOW = Date.parse('2026-08-13T00:00:00+08:00')

test('生长阶段：已赎回 → 枯萎', () => {
  assert.equal(calcGrowthStage(NOW - 40 * DAY, 7, true, NOW), 'wilted')
})

test('生长阶段：达到成熟周期 → 成熟', () => {
  assert.equal(calcGrowthStage(NOW - 8 * DAY, 7, false, NOW), 'mature')
  assert.equal(calcGrowthStage(NOW - 7 * DAY, 7, false, NOW), 'mature')
})

test('生长阶段：按时间进度分段（种子/发芽/生长）', () => {
  assert.equal(calcGrowthStage(NOW - 1 * DAY, 7, false, NOW), 'seed') // 14%
  assert.equal(calcGrowthStage(NOW - 3 * DAY, 7, false, NOW), 'sprout') // 43%
  assert.equal(calcGrowthStage(NOW - 5 * DAY, 7, false, NOW), 'growing') // 71%
})

test('植物信息补全：含物种与进度', () => {
  const plant = enrichPlant(
    { id: 'p_x', species: 'sunflower', plot: '花园', plotType: 'garden', plantedAt: NOW - 40 * DAY, redeemed: false },
    NOW,
  )
  assert.equal(plant.stage, 'mature')
  assert.equal(plant.emoji, '🌻')
  assert.equal(plant.progress, 1)
})

test('答题判分：全对/部分对/错题解析', () => {
  const bank = [
    { id: 'q1', question: '1+1=?', options: ['1', '2'], answer: 1, explain: '基础算术' },
    { id: 'q2', question: '1+2=?', options: ['2', '3', '4'], answer: 1, explain: '基础算术' },
  ]
  const allRight = gradeAnswers(
    [{ id: 'q1', answer: 1 }, { id: 'q2', answer: 1 }],
    bank,
  )
  assert.equal(allRight.score, 2)

  const half = gradeAnswers([{ id: 'q1', answer: 1 }, { id: 'q2', answer: 0 }], bank)
  assert.equal(half.score, 1)
  assert.equal(half.detail[1].correct, false)
  assert.equal(half.detail[1].rightAnswer, 1)
})

test('健康度评分：结果在 0~100 且维度齐全', () => {
  const portfolio = {
    totalAssets: 1535800,
    totalLiabilities: 380000,
    categories: [
      { category: '现金及存款', amount: 86500 },
      { category: '权益类', amount: 68200 },
      { category: '基金理财', amount: 123800 },
      { category: '不动产', amount: 1200000 },
      { category: '保险', amount: 45000 },
      { category: '其他', amount: 12300 },
    ],
  }
  const trend = Array.from({ length: 31 }, (_, i) => ({ netWorth: 1117000 + i * 1234 }))
  const cashflow = { monthlyIncome: 28500, monthlyExpense: 16800 }
  const result = scorePortfolio(portfolio, trend, cashflow)
  assert.ok(result.score >= 0 && result.score <= 100)
  assert.equal(result.dimensions.length, 3)
})
