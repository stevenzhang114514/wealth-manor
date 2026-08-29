<script setup>
/**
 * 风险评估问卷（10题）：模拟银行风评流程，结果决定模拟器初始可购产品范围
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRiskQuestions, submitRiskAssessment } from '../api/simulator.js'
import { useSimulatorStore } from '../stores/simulator.js'
import BackHeader from '../components/BackHeader.vue'

const router = useRouter()
const sim = useSimulatorStore()

const questions = ref([])
const answers = ref({}) // id -> option index
const result = ref(null)
const submitting = ref(false)

onMounted(async () => {
  questions.value = await getRiskQuestions()
})

const answeredCount = computed(() => Object.keys(answers.value).length)
const allAnswered = computed(() => answeredCount.value === questions.value.length)
const progress = computed(() =>
  questions.value.length ? (answeredCount.value / questions.value.length) * 100 : 0,
)

const pick = (qid, idx) => {
  answers.value[qid] = idx
}

const submit = async () => {
  if (!allAnswered.value || submitting.value) return
  submitting.value = true
  try {
    const payload = questions.value.map((q) => ({ id: q.id, option: answers.value[q.id] }))
    result.value = await submitRiskAssessment(payload)
    sim.setRiskLevel(result.value.level)
  } finally {
    submitting.value = false
  }
}

const toSimulator = () => router.push('/simulator')
</script>

<template>
  <div class="risk-view">
    <BackHeader title="🛡️ 风险评估" />

    <!-- 问卷 -->
    <template v-if="!result">
      <div class="progress-wrap">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-num">{{ answeredCount }}/{{ questions.length }}</span>
      </div>

      <div class="wm-card">
        <div class="card-title">📋 风险承受能力问卷</div>
        <div v-for="(q, qi) in questions" :key="q.id" class="q-block">
          <div class="q-title">{{ qi + 1 }}. {{ q.question }}</div>
          <button
            v-for="(opt, oi) in q.options"
            :key="oi"
            class="q-option"
            :class="{ picked: answers[q.id] === oi }"
            @click="pick(q.id, oi)"
          >
            {{ opt.text }}
          </button>
        </div>
      </div>

      <div class="submit-row">
        <button class="wm-btn submit-btn" :disabled="!allAnswered || submitting" @click="submit">
          {{ submitting ? '评估中…' : '提交评估' }}
        </button>
      </div>
    </template>

    <!-- 结果 -->
    <template v-else>
      <div class="result-hero">
        <div class="rh-level">{{ result.level }}</div>
        <div class="rh-name">{{ result.levelName }}</div>
        <div class="rh-score">测评得分 {{ result.score }}/{{ result.maxScore }}</div>
        <div class="rh-desc">{{ result.desc }}</div>
      </div>
      <div class="wm-card">
        <div class="card-title">🔓 您可以购买的产品范围</div>
        <div class="hint-text">模拟器中，风险等级高于 {{ result.level }} 的产品将被锁定</div>
      </div>
      <div class="submit-row">
        <button class="wm-btn submit-btn" @click="toSimulator">🚀 开始财富人生模拟</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.risk-view {
  padding-bottom: 14px;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 12px 0;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--fill);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--ios-blue);
  border-radius: 999px;
  transition: width 0.25s ease;
}

.progress-num {
  font-size: 10.5px;
  color: var(--text-sub);
}

.q-block {
  margin-bottom: 16px;
}

.q-title {
  font-size: 12.5px;
  font-weight: 700;
  margin-bottom: 7px;
}

.q-option {
  display: block;
  width: 100%;
  text-align: left;
  border: 1px solid #e8ecf0;
  background: #fff;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 11.5px;
  margin-bottom: 6px;
  cursor: pointer;
  color: var(--text-main);
  transition: all 0.15s ease;
}

.q-option.picked {
  border-color: var(--ios-blue);
  background: #eef4ff;
  font-weight: 700;
}

.submit-row {
  margin: 4px 12px 0;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  font-size: 14px;
}

.result-hero {
  margin: 10px 12px 0;
  background: linear-gradient(135deg, #007aff, #0055c8);
  border-radius: var(--r-lg);
  padding: 26px 20px;
  text-align: center;
  color: #fff;
}

.rh-level {
  font-size: 42px;
  font-weight: 800;
}

.rh-name {
  font-size: 16px;
  font-weight: 800;
  margin-top: 2px;
}

.rh-score {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 4px;
}

.rh-desc {
  font-size: 11px;
  opacity: 0.9;
  margin-top: 10px;
  line-height: 1.6;
}

.hint-text {
  font-size: 11px;
  color: var(--text-sub);
}
</style>
