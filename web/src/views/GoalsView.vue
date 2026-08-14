<script setup>
/**
 * 场景化理财规划：购房/教育/养老/应急 测算器 + 已存目标
 */
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { planGoal, getGoals } from '../api/goal.js'
import { formatMoney } from '../utils/format.js'
import { toast } from '../utils/toast.js'
import BackHeader from '../components/BackHeader.vue'
import SegmentedControl from '../components/SegmentedControl.vue'

const TABS = [
  { key: 'home', label: '🏠 购房' },
  { key: 'education', label: '🎓 教育' },
  { key: 'retirement', label: '🌅 养老' },
  { key: 'emergency', label: '🧯 应急' },
]

const tab = ref('home')
const result = ref(null)
const savedGoals = ref([])
const calculating = ref(false)

const forms = reactive({
  home: { price: 300, downPaymentPct: 30, years: 5 },
  education: { childAge: 6, targetAmount: 100, universityAge: 18 },
  retirement: { currentAge: 28, retireAge: 60, monthlyIncome: 5000, expectedYears: 25 },
  emergency: { monthlyExpense: 16800 },
})

const currentForm = computed(() => forms[tab.value])

const FIELDS = {
  home: [
    { key: 'price', label: '目标房价（万元）', type: 'number', unit: '万' },
    { key: 'downPaymentPct', label: '首付比例（%）', type: 'number', unit: '%' },
    { key: 'years', label: '计划年数', type: 'number', unit: '年' },
  ],
  education: [
    { key: 'childAge', label: '孩子当前年龄', type: 'number', unit: '岁' },
    { key: 'targetAmount', label: '教育金目标（万元）', type: 'number', unit: '万' },
    { key: 'universityAge', label: '目标入学年龄', type: 'number', unit: '岁' },
  ],
  retirement: [
    { key: 'currentAge', label: '当前年龄', type: 'number', unit: '岁' },
    { key: 'retireAge', label: '期望退休年龄', type: 'number', unit: '岁' },
    { key: 'monthlyIncome', label: '退休后月补充（元）', type: 'number', unit: '元' },
    { key: 'expectedYears', label: '退休生活年限', type: 'number', unit: '年' },
  ],
  emergency: [{ key: 'monthlyExpense', label: '月支出（元）', type: 'number', unit: '元' }],
}

const loadGoals = async () => {
  savedGoals.value = await getGoals()
}

onMounted(loadGoals)

const calc = async (save = false) => {
  calculating.value = true
  result.value = null
  try {
    // 万元 → 元 换算（仅 home/education 的金额字段）
    const params = { ...currentForm.value }
    if (tab.value === 'home') params.price = Math.round(params.price * 10000)
    if (tab.value === 'education') params.targetAmount = Math.round(params.targetAmount * 10000)
    const res = await planGoal(tab.value, params, save)
    result.value = res.plan
    if (save) {
      toast('已保存到我的目标', 'success')
      loadGoals()
    }
  } catch {
    // 错误提示由拦截器统一弹出
  } finally {
    calculating.value = false
  }
}

const GOAL_LABELS = { home: '🏠', education: '🎓', retirement: '🌅', emergency: '🧯' }

// 切换测算类型时清空上次结果
watch(tab, () => {
  result.value = null
})
</script>

<template>
  <div class="goals-view">
    <BackHeader title="🎯 目标规划" />

    <SegmentedControl v-model="tab" :options="TABS" />

    <!-- 参数表单 -->
    <div class="wm-card">
      <div class="card-title">✏️ 输入目标参数</div>
      <div v-for="f in FIELDS[tab]" :key="f.key" class="form-row">
        <label class="form-label">{{ f.label }}</label>
        <input v-model.number="currentForm[f.key]" type="number" class="form-input" />
        <span class="form-unit">{{ f.unit }}</span>
      </div>
      <div class="form-actions">
        <button class="wm-btn" :disabled="calculating" @click="calc(false)">
          {{ calculating ? '测算中…' : '🧮 测算' }}
        </button>
        <button class="wm-btn ghost" :disabled="calculating || !result" @click="calc(true)">
          💾 保存目标
        </button>
      </div>
    </div>

    <!-- 测算结果 -->
    <div v-if="result" class="wm-card result-card">
      <div class="card-title">📋 测算结果</div>
      <template v-if="result.goalType === 'emergency'">
        <div class="result-big">
          建议储备 {{ formatMoney(result.reserveMin) }} ~ {{ formatMoney(result.reserveMax) }}
        </div>
      </template>
      <template v-else>
        <div class="result-rows">
          <div class="r-row">
            <span>目标金额</span>
            <b>{{ formatMoney(result.targetAmount) }}</b>
          </div>
          <div class="r-row">
            <span>每月需投入</span>
            <b class="r-main">{{ formatMoney(result.monthlyNeed) }}</b>
          </div>
          <div class="r-row">
            <span>投入时长</span>
            <b
              >{{ Math.round(result.durationMonths / 12) }} 年（{{
                result.durationMonths
              }}
              个月）</b
            >
          </div>
        </div>
      </template>
      <div class="result-suggestion">💡 {{ result.suggestion }}</div>
      <div class="result-products">
        <span v-for="p in result.products" :key="p" class="wm-chip ok">{{ p }}</span>
      </div>
      <div class="result-note">按年化 4% 复利测算（演示口径），实际以产品为准</div>
    </div>

    <!-- 已保存目标 -->
    <div v-if="savedGoals.length" class="wm-card">
      <div class="card-title">📁 我的目标（{{ savedGoals.length }}）</div>
      <div v-for="g in savedGoals" :key="g.id" class="saved-goal">
        <div class="sg-head">
          <span class="sg-icon">{{ GOAL_LABELS[g.goalType] }}</span>
          <span class="sg-label">{{ g.label }}</span>
          <span class="sg-date">{{ g.createdAt }}</span>
        </div>
        <div v-if="g.plan.goalType === 'emergency'" class="sg-plan">
          建议储备 {{ formatMoney(g.plan.reserveMin) }} ~ {{ formatMoney(g.plan.reserveMax) }}
        </div>
        <div v-else class="sg-plan">
          目标 {{ formatMoney(g.plan.targetAmount) }} · 每月 {{ formatMoney(g.plan.monthlyNeed) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.goals-view {
  padding-bottom: 14px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}

.form-label {
  font-size: 11.5px;
  color: var(--text-sub);
  width: 118px;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  border: 1px solid #e8ecf0;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  outline: none;
}

.form-input:focus {
  border-color: var(--ios-blue);
}

.form-unit {
  font-size: 10.5px;
  color: var(--text-sub);
  width: 22px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.form-actions .wm-btn {
  flex: 1;
  font-size: 12px;
}

.result-rows {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.r-row {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--text-sub);
}

.r-row b {
  color: var(--text-main);
}

.r-main {
  color: var(--ios-blue) !important;
  font-size: 15px;
}

.result-big {
  font-size: 15px;
  font-weight: 800;
  color: var(--ios-blue);
  margin-bottom: 4px;
}

.result-suggestion {
  font-size: 11.5px;
  line-height: 1.6;
  color: #4b5563;
  background: #f7f8fa;
  border-radius: 10px;
  padding: 8px 10px;
  margin: 10px 0 8px;
}

.result-products {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.result-note {
  font-size: 9.5px;
  color: #b0b5bd;
  margin-top: 8px;
  text-align: right;
}

.saved-goal {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
}

.sg-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
}

.sg-label {
  font-size: 12.5px;
  font-weight: 800;
}

.sg-date {
  margin-left: auto;
  font-size: 9.5px;
  color: var(--text-sub);
}

.sg-plan {
  font-size: 11px;
  color: var(--text-sub);
}
</style>
