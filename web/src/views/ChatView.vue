<script setup>
/**
 * AI 理财助手「小满」：规则引擎问答 + 建议追问 chips + 打字动画
 * 【扩展点】生产环境：后端接入大模型（双引擎：大模型生成 + 规则兜底）
 */
import { ref, nextTick, onMounted } from 'vue'
import { chatWithAI } from '../api/ai.js'
import BackHeader from '../components/BackHeader.vue'

const GREETING = {
  reply:
    '你好呀，我是你的AI理财助手小满🌾\n理财路上有任何疑问都可以问我：定投、风险、房贷、养老、应急储备、市场行情……',
  chips: ['如何定投？', '应急储备留多少？', '帮我做养老规划'],
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
    // 模拟思考延迟，提升对话体验
    await new Promise((r) => setTimeout(r, 600))
    const res = await chatWithAI(content)
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
    <BackHeader title="🤖 小满 · AI理财助手" />

    <div ref="listEl" class="chat-list">
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="msg-row"
        :class="m.role === 'user' ? 'user' : 'ai'"
      >
        <div v-if="m.role === 'ai'" class="ai-avatar">🌾</div>
        <div class="bubble-wrap">
          <div class="bubble">{{ m.reply }}</div>
          <div v-if="m.role === 'ai' && m.chips?.length" class="chips">
            <button v-for="c in m.chips" :key="c" class="chip" @click="send(c)">{{ c }}</button>
          </div>
        </div>
      </div>

      <div v-if="typing" class="msg-row ai">
        <div class="ai-avatar">🌾</div>
        <div class="bubble typing"><span></span><span></span><span></span></div>
      </div>
    </div>

    <div class="chat-input-bar">
      <input
        v-model="input"
        class="chat-input"
        placeholder="问问小满理财问题…"
        @keyup.enter="send()"
      />
      <button class="wm-btn send-btn" :disabled="!input.trim() || typing" @click="send()">
        发送
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
  background: linear-gradient(135deg, #eef6ee, #dceadc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.bubble-wrap {
  max-width: 76%;
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
  background: linear-gradient(135deg, var(--ios-blue), var(--ios-blue-dark));
  color: #fff;
  border-radius: 14px 14px 4px 14px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  border: 1px solid #f0c9d0;
  background: #fff;
  color: var(--ios-blue);
  font-size: 10.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.chip:active {
  background: #eef4ff;
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
