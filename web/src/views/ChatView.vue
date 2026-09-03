<script setup>
/**
 * AI金融翻译器（合规版）：只解释金融名词，不提供任何投资建议
 * 词条卡样式 + 免责声明常驻
 */
import { ref, nextTick, onMounted } from 'vue'
import { translateMessage } from '../api/ai.js'
import BackHeader from '../components/BackHeader.vue'

const DISCLAIMER = '本翻译器仅解释金融概念，不构成任何投资建议。市场有风险，决策请独立判断。'

const GREETING = {
  reply:
    '你好，我是AI金融翻译器📖\n把晦涩的金融术语翻译成大白话。试试问我：ETF、复利、存款保险、净值、波动率、黑天鹅……',
  chips: ['什么是ETF？', '复利是什么意思', '存款保险是什么'],
}

const messages = ref([{ role: 'ai', ...GREETING }])
const input = ref('')
const typing = ref(false)
const listEl = ref(null)

const scrollToBottom = async () => {
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}

onMounted(scrollToBottom)

const send = async (text) => {
  const content = (text ?? input.value).trim()
  if (!content || typing.value) return
  input.value = ''
  messages.value.push({ role: 'user', reply: content, chips: [] })
  scrollToBottom()
  typing.value = true
  try {
    await new Promise((r) => setTimeout(r, 500))
    const res = await translateMessage(content)
    messages.value.push({ role: 'ai', ...res })
    typing.value = false
    scrollToBottom()
  } catch {
    typing.value = false
  }
}
</script>

<template>
  <div class="chat-view">
    <BackHeader title="📖 AI金融翻译器" />

    <div ref="listEl" class="chat-list">
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="msg-row"
        :class="m.role === 'user' ? 'user' : 'ai'"
      >
        <div v-if="m.role === 'ai'" class="ai-avatar">📖</div>
        <div class="bubble-wrap">
          <!-- 词条卡 -->
          <div v-if="m.type === 'glossary'" class="term-card">
            <div class="term-name">{{ m.term }}</div>
            <div class="term-explain">{{ m.explain }}</div>
          </div>
          <div v-else class="bubble">{{ m.reply || m.explain }}</div>
          <div v-if="m.role === 'ai' && m.chips?.length" class="chips">
            <button v-for="c in m.chips" :key="c" class="chip" @click="send(c)">{{ c }}</button>
          </div>
        </div>
      </div>

      <div v-if="typing" class="msg-row ai">
        <div class="ai-avatar">📖</div>
        <div class="bubble typing"><span></span><span></span><span></span></div>
      </div>
    </div>

    <!-- 免责声明常驻 -->
    <div class="disclaimer-bar">⚖️ {{ DISCLAIMER }}</div>

    <div class="chat-input-bar">
      <input
        v-model="input"
        class="chat-input"
        placeholder="输入想了解的金融术语…"
        @keyup.enter="send()"
      />
      <button class="wm-btn send-btn" :disabled="!input.trim() || typing" @click="send()">
        翻译
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: none;
}

.msg-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.msg-row.user {
  justify-content: flex-end;
}

.ai-avatar {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eef4ff, #dce8fd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.bubble-wrap {
  max-width: 78%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.msg-row.user .bubble-wrap {
  align-items: flex-end;
}

.bubble {
  background: #fff;
  border-radius: 14px 14px 14px 4px;
  padding: 10px 13px;
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-line;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.05);
}

.msg-row.user .bubble {
  background: linear-gradient(135deg, #007aff, #0055c8);
  color: #fff;
  border-radius: 14px 14px 4px 14px;
}

/* 词条卡 */
.term-card {
  background: #fff;
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.05);
  border-left: 3px solid var(--ios-blue);
}

.term-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--ios-blue);
  margin-bottom: 5px;
}

.term-explain {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-main);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  border: 1px solid #c9d8f5;
  background: #fff;
  color: var(--ios-blue);
  font-size: 10.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.bubble.typing {
  display: flex;
  gap: 4px;
  padding: 13px 15px;
}

.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b8bdc4;
  animation: blink 1s infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.18s;
}

.typing span:nth-child(3) {
  animation-delay: 0.36s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
  }
  40% {
    opacity: 1;
  }
}

.disclaimer-bar {
  flex-shrink: 0;
  font-size: 9.5px;
  color: var(--text-sub);
  text-align: center;
  padding: 6px 12px;
  background: #f7f8fa;
  border-top: 0.5px solid var(--separator);
}

.chat-input-bar {
  display: flex;
  gap: 8px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #eef0f2;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  border: 1px solid #e8ecf0;
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 12.5px;
  outline: none;
}

.chat-input:focus {
  border-color: var(--ios-blue);
}

.send-btn {
  font-size: 12px;
  padding: 8px 16px;
}
</style>
