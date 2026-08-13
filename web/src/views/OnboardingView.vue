<script setup>
/**
 * 新手引导（6步）+ 庄园创建：
 * 首次进入自动展示（localStorage 标记），庄园主页可随时重玩
 * Step1-5 概念引导 → Step6 创建庄园（名称 + 中式/西式/日式风格）
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createManor } from '../api/manor.js'
import { useManorStore } from '../stores/manor.js'
import { toast } from '../utils/toast.js'

const router = useRouter()
const manor = useManorStore()

const STEPS = [
  {
    icon: '🏡',
    title: '欢迎来到财富庄园',
    desc: '这里是你专属的理财乐园：\n每一株植物，都对应一笔真实的理财产品；每一次收获，都是时间的复利在兑现。',
  },
  {
    icon: '📊',
    title: '先看清你的财富版图',
    desc: '工行资产自动同步，他行/证券/不动产一键导入，\n财富树一屏总览你的全部资产与配置结构。',
  },
  {
    icon: '🌻',
    title: '种下第一颗种子',
    desc: '购买理财产品即可获得对应种子：\n稳健型→花朵，进取型→果树，长期型→林木。\n收益率 = 果实品质与数量。',
  },
  {
    icon: '☀️',
    title: '天气 = 今日行情',
    desc: '晴天持仓盈利、雨天小幅回调、彩虹收益新高。\n市场大跌时庄园会提醒你：冷静，回调孕育加仓机会。',
  },
  {
    icon: '🎓',
    title: '知识问答闯关',
    desc: '每日5题理财知识，答对得金币经验，\n满分集齐徽章碎片——边玩边学会理财。',
  },
  {
    icon: '🎁',
    title: '创建你的庄园',
    desc: '给你的庄园起个名字、选个风格，\n新手礼包已备好，7天新手保护期即刻生效！',
  },
]

const step = ref(0)
const name = ref('明曦庄园')
const style = ref('中式')

const isLast = computed(() => step.value === STEPS.length - 1)

const STYLES = [
  { key: '中式', icon: '🏯', desc: '青砖黛瓦，古典雅致' },
  { key: '西式', icon: '🏰', desc: '浪漫城堡，梦幻花园' },
  { key: '日式', icon: '⛩️', desc: '枯山水意，禅意静心' },
]

const next = () => {
  if (step.value < STEPS.length - 1) step.value += 1
}

const prev = () => {
  if (step.value > 0) step.value -= 1
}

const finish = async () => {
  if (!name.value.trim()) {
    toast('给庄园起个名字吧', 'error')
    return
  }
  const state = await createManor({ name: name.value.trim(), style: style.value })
  manor.setState(state)
  localStorage.setItem('wm-onboarded', '1')
  toast(`🎉 欢迎来到「${state.name}」！新手礼包已发放`, 'success')
  router.push('/manor')
}
</script>

<template>
  <div class="onboard-view">
    <!-- 步骤插画 -->
    <div class="step-stage">
      <div class="stage-icon">{{ STEPS[step].icon }}</div>
      <div class="stage-title">{{ STEPS[step].title }}</div>
      <div class="stage-desc">{{ STEPS[step].desc }}</div>

      <!-- 创建表单（最后一步） -->
      <div v-if="isLast" class="create-form">
        <input
          v-model="name"
          class="manor-name-input"
          placeholder="给你的庄园起个名字"
          maxlength="12"
        />
        <div class="style-cards">
          <button
            v-for="s in STYLES"
            :key="s.key"
            class="style-card"
            :class="{ picked: style === s.key }"
            @click="style = s.key"
          >
            <span class="style-icon">{{ s.icon }}</span>
            <span class="style-name">{{ s.key }}</span>
            <span class="style-desc">{{ s.desc }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 进度点 -->
    <div class="step-dots">
      <span
        v-for="(s, i) in STEPS"
        :key="i"
        class="dot"
        :class="{ active: i === step, done: i < step }"
      ></span>
    </div>

    <!-- 操作 -->
    <div class="step-actions">
      <button v-if="step > 0" class="wm-btn ghost" @click="prev">上一步</button>
      <button v-if="!isLast" class="wm-btn" @click="next">下一步 →</button>
      <button v-else class="wm-btn" @click="finish">🎉 创建庄园</button>
    </div>
  </div>
</template>

<style scoped>
.onboard-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 26px 20px 20px;
  background: linear-gradient(180deg, #eef7e9 0%, #f6fbf3 40%, var(--bg) 100%);
}

.step-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stage-icon {
  font-size: 64px;
  margin: 18px 0 14px;
  animation: float 2.6s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.stage-title {
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 10px;
}

.stage-desc {
  font-size: 12.5px;
  line-height: 2;
  color: #5d6672;
  white-space: pre-line;
  max-width: 290px;
}

.create-form {
  width: 100%;
  margin-top: 18px;
}

.manor-name-input {
  width: 100%;
  border: 1.5px solid #dbe7d5;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  text-align: center;
  outline: none;
  background: #fff;
}

.manor-name-input:focus {
  border-color: var(--manor-green);
}

.style-cards {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.style-card {
  flex: 1;
  border: 1.5px solid #e3e8e0;
  background: #fff;
  border-radius: 14px;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.style-card.picked {
  border-color: var(--icbc-red);
  background: #fdf1f3;
  transform: scale(1.03);
}

.style-icon {
  font-size: 26px;
}

.style-name {
  font-size: 12px;
  font-weight: 800;
}

.style-desc {
  font-size: 9px;
  color: var(--text-sub);
}

.step-dots {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin: 18px 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #d9ded6;
  transition: all 0.25s ease;
}

.dot.active {
  width: 22px;
  background: var(--icbc-red);
}

.dot.done {
  background: var(--manor-green);
}

.step-actions {
  display: flex;
  gap: 10px;
}

.step-actions .wm-btn {
  flex: 1;
  padding: 12px;
}
</style>
