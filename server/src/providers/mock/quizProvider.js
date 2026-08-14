/**
 * 题库 Mock Provider
 *
 * 【契约】真实环境实现 src/providers/prod/quizProvider.js 时，
 * 必须导出与本文件一致的函数签名与返回结构：
 *   getQuestionBank() → [{ id, question, options: string[], answer, explain }]
 */
import { QUESTION_BANK } from '../../data/quizBank.js'

export function getQuestionBank() {
  return QUESTION_BANK.map((q) => ({ ...q, options: [...q.options] }))
}
