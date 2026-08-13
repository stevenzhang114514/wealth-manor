/**
 * 知识答题服务（业务逻辑层）
 */
import { getProvider } from '../providers/index.js'
import { shuffle } from '../utils/random.js'
import { applyRewards } from './manorService.js'

const provider = await getProvider('quiz')

/** 抽取 n 道题（不打乱则按题库顺序），隐藏答案与解析 */
export async function getQuestions(n = 5) {
  const bank = provider.getQuestionBank()
  const picked = shuffle(bank, Math.random).slice(0, Math.min(n, bank.length))
  return picked.map(({ id, question, options }) => ({ id, question, options }))
}

/**
 * 判分（纯函数，便于单元测试）
 * answers: [{ id, answer }]，answer 为选项下标
 */
export function gradeAnswers(answers, bank) {
  const bankMap = new Map(bank.map((q) => [q.id, q]))
  let score = 0
  const detail = answers.map((a) => {
    const q = bankMap.get(a.id)
    const correct = !!q && q.answer === a.answer
    if (correct) score += 1
    return {
      id: a.id,
      correct,
      yourAnswer: a.answer,
      rightAnswer: q?.answer ?? -1,
      explain: q?.explain ?? '',
    }
  })
  return { score, total: answers.length, detail }
}

/**
 * 提交答卷：判分 → 计算奖励（答对1题=2金币+1经验，满分额外+1徽章碎片）→ 入账
 */
export async function submitAnswers(answers) {
  const bank = provider.getQuestionBank()
  const { score, total, detail } = gradeAnswers(answers, bank)
  const rewards = {
    coins: score * 2,
    exp: score,
    badgeFragment: score === total && total > 0 ? 1 : 0,
  }
  const manor = await applyRewards(rewards)
  return { score, total, detail, rewards, manor }
}
