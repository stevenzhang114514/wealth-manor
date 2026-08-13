/** 答题域接口封装（与 server/src/routes/quiz.js 一一对应） */
import http from './http.js'

export const getQuizQuestions = (n = 5) => http.get('/quiz/questions', { params: { n } })

export const submitQuiz = (answers) => http.post('/quiz/submit', { answers })
