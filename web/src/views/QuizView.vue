<script setup>
/**
 * 知识答题：每日5题 → 即时判分 → 金币/经验/徽章碎片奖励
 * 状态机：start（开始页）→ answering（答题中）→ result（结果页）
 */
import { ref, computed } from 'vue'
import { getQuizQuestions, submitQuiz } from '../api/quiz.js'
import { useManorStore } from '../stores/manor.js'

const manor = useManorStore()

const phase = ref('start')
const questions = ref([])
const answers = ref([])
const current = ref(0)
const result = ref(null)
const submitting = ref(false)

const total = computed(() => questions.value.length)
const currentQ = computed(() => questions.value[current.value])
const answeredCount = computed(() => answers.value.filter((a) => a !== -1).length)
const allAnswered = computed(() => answeredCount.value === total.value && total.value > 0)

const start = async () => {
  questions.value = await getQuizQuestions(5)
  answers.value = Array(questions.value.length).fill(-1)
  current.value = 0
  result.value = null
  phase.value = 'answering'
}

const pick = (idx) => {
  answers.value[current.value] = idx
}

const next = () => {
  if (current.value < total.value - 1) {
    current.value += 1
  } else {
    submit()
  }
}

const prev = () => {
  if (current.value > 0) current.value -= 1
}

const submit = async () => {
  if (!allAnswered.value || submitting.value) return
  submitting.value = true
  try {
    const payload = questions.value.map((q, i) => ({ id: q.id, answer: answers.value[i] }))
    result.value = await submitQuiz(payload)
    manor.setState(result.value.manor)
    phase.value = 'result'
  } finally {
    submitting.value = false
  }
}

const restart = () => {
  phase.value = 'start'
  result.value = null
}
</script>

<template>
  <div class="quiz-view">
    <!-- 开始页 -->
    <div v-if="phase === 'start'" class="quiz-start">
      <div class="start-card">
        <div class="start-icon">🎓</div>
        <div class="start-title">每日理财知识问答</div>
        <div class="start-desc">
          随机5题 · 答对1题得 <b>🪙2金币 + ⭐1经验</b><br />
          满分额外获得 <b>🏅徽章碎片</b> · 每天1次
        </div>
        <button class="wm-btn start-btn" @click="start">开始答题</button>
      </div>
    </div>

    <!-- 答题中 -->
    <div v-else-if="phase === 'answering'" class="quiz-answering">
      <div class="qa-header">
        <div class="qa-progress-text">第 {{ current + 1 }} / {{ total }} 题</div>
        <div class="qa-dots">
          <span
            v-for="(a, i) in answers"
            :key="i"
            class="dot"
            :class="{ done: a !== -1, active: i === current }"
          ></span>
        </div>
      </div>

      <div v-if="currentQ" class="question-card">
        <div class="q-text">{{ currentQ.question }}</div>
        <div class="q-options">
          <button
            v-for="(opt, idx) in currentQ.options"
            :key="idx"
            class="option"
            :class="{ picked: answers[current] === idx }"
            @click="pick(idx)"
          >
            <span class="opt-letter">{{ 'ABCD'[idx] }}</span>
            {{ opt }}
          </button>
        </div>
      </div>

      <div class="qa-footer">
        <button class="wm-btn ghost" :disabled="current === 0" @click="prev">上一题</button>
        <button class="wm-btn" :disabled="current === total - 1 ? !allAnswered : false" @click="next">
          {{ current === total - 1 ? (submitting ? '判分中…' : '提交答卷') : '下一题' }}
        </button>
      </div>
    </div>

    <!-- 结果页 -->
    <div v-else-if="phase === 'result' && result" class="quiz-result">
      <div class="result-card">
        <div class="result-emoji">{{ result.score === result.total ? '🏆' : result.score >= 3 ? '🎉' : '📖' }}</div>
        <div class="result-score-ring" :style="{ '--pct': (result.score / result.total) * 100 + '%' }">
          <span class="score-num">{{ result.score }}</span>
          <span class="score-total">/ {{ result.total }}</span>
        </div>
        <div class="result-title">
          {{ result.score === result.total ? '满分！理财知识达人' : result.score >= 3 ? '不错哦，继续加油' : '温故知新，明天再来' }}
        </div>
        <div class="result-rewards">
          <span class="wm-chip">🪙 +{{ result.rewards.coins }} 金币</span>
          <span class="wm-chip">⭐ +{{ result.rewards.exp }} 经验</span>
          <span v-if="result.rewards.badgeFragment" class="wm-chip warn">🏅 +1 徽章碎片</span>
        </div>

        <div class="explain-list">
          <div v-for="(d, i) in result.detail" :key="d.id" class="explain-item">
            <div class="ex-row">
              <span :class="d.correct ? 'ex-ok' : 'ex-no'">{{ d.correct ? '✓' : '✗' }}</span>
              <span class="ex-question">{{ questions[i]?.question }}</span>
            </div>
            <div v-if="!d.correct" class="ex-answer">
              正确答案：{{ 'ABCD'[d.rightAnswer] }} · {{ questions[i]?.options[d.rightAnswer] }}
            </div>
            <div class="ex-explain">{{ d.explain }}</div>
          </div>
        </div>

        <button class="wm-btn result-btn" @click="restart">明日再来（演示重置）</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 开始页 */
.quiz-start {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.start-card {
  background: #fff;
  border-radius: 20px;
  padding: 36px 26px;
  text-align: center;
  width: 100%;
  box-shadow: 0 6px 24px rgba(31, 45, 61, 0.07);
}

.start-icon {
  font-size: 52px;
}

.start-title {
  font-size: 17px;
  font-weight: 800;
  margin: 12px 0 10px;
}

.start-desc {
  font-size: 12px;
  color: var(--text-sub);
  line-height: 2;
  margin-bottom: 20px;
}

.start-btn {
  width: 100%;
  padding: 12px;
}

/* 答题中 */
.quiz-answering {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.qa-header {
  margin-bottom: 14px;
}

.qa-progress-text {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.qa-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 30px;
  height: 5px;
  border-radius: 999px;
  background: #e4e7eb;
  transition: background 0.2s ease;
}

.dot.done {
  background: var(--gold);
}

.dot.active {
  background: var(--icbc-red);
}

.question-card {
  flex: 1;
}

.q-text {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.5;
  margin-bottom: 16px;
}

.q-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid #e8ecf0;
  background: #fff;
  border-radius: 13px;
  padding: 12px;
  font-size: 13.5px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--text-main);
}

.option.picked {
  border-color: var(--icbc-red);
  background: #fdf1f3;
}

.opt-letter {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.option.picked .opt-letter {
  background: var(--icbc-red);
  color: #fff;
}

.qa-footer {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.qa-footer .wm-btn {
  flex: 1;
}

/* 结果页 */
.quiz-result {
  padding: 16px;
}

.result-card {
  background: #fff;
  border-radius: 20px;
  padding: 26px 20px;
  text-align: center;
  box-shadow: 0 6px 24px rgba(31, 45, 61, 0.07);
}

.result-emoji {
  font-size: 40px;
}

.result-score-ring {
  width: 96px;
  height: 96px;
  margin: 12px auto;
  border-radius: 50%;
  background: conic-gradient(var(--icbc-red) var(--pct), #eef0f2 var(--pct));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.result-score-ring::before {
  content: '';
  position: absolute;
  inset: 9px;
  background: #fff;
  border-radius: 50%;
}

.score-num {
  position: relative;
  font-size: 30px;
  font-weight: 800;
  color: var(--icbc-red);
}

.score-total {
  position: relative;
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 10px;
}

.result-title {
  font-size: 14px;
  font-weight: 700;
  margin: 10px 0;
}

.result-rewards {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.explain-list {
  text-align: left;
  border-top: 1px dashed #eef0f2;
  padding-top: 12px;
}

.explain-item {
  padding: 8px 0;
  border-bottom: 1px dashed #f2f3f5;
}

.ex-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.ex-ok {
  color: var(--success);
  font-weight: 800;
}

.ex-no {
  color: var(--danger);
  font-weight: 800;
}

.ex-question {
  font-size: 12px;
  font-weight: 600;
}

.ex-answer {
  font-size: 11px;
  color: var(--danger);
  margin: 4px 0 0 20px;
}

.ex-explain {
  font-size: 10.5px;
  color: var(--text-sub);
  margin: 4px 0 0 20px;
  line-height: 1.6;
}

.result-btn {
  width: 100%;
  margin-top: 16px;
}
</style>
