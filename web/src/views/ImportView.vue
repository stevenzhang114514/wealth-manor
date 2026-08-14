<script setup>
/**
 * 资产导入（四通道）：自动同步 / 扫码导入 / 拍照OCR / 手动录入
 * 手动录入真实入账（POST /assets/import），看板实时重算
 */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { importAsset } from '../api/assets.js'
import { formatMoney } from '../utils/format.js'
import { toast } from '../utils/toast.js'
import BackHeader from '../components/BackHeader.vue'

const router = useRouter()
const scanning = ref('')
const imported = ref(null)
const submitting = ref(false)

const CHANNELS = [
  {
    key: '自动同步',
    icon: '🏦',
    title: '银行资产自动同步',
    desc: '存款/理财/基金/贷款/信用卡，行内直连免操作',
    action: 'sync',
  },
  {
    key: '扫码导入',
    icon: '📱',
    title: '他行/证券扫码导入',
    desc: '银联授权 + 券商持仓截图 OCR 识别',
    action: 'scan',
  },
  {
    key: 'OCR识别',
    icon: '📷',
    title: '不动产/保单拍照识别',
    desc: '房产证/车辆登记证/保单 OCR + 自动估值',
    action: 'ocr',
  },
  {
    key: '手动录入',
    icon: '✍️',
    title: '手动/智能录入',
    desc: '海外资产/数字资产/其他，支持任意资产',
    action: 'form',
  },
]

const form = reactive({
  name: '',
  category: '现金及存款',
  amount: '',
})

const CATEGORIES = ['现金及存款', '权益类', '基金理财', '不动产', '保险', '其他']

const onChannel = async (ch) => {
  if (ch.action === 'sync') {
    scanning.value = ch.key
    await new Promise((r) => setTimeout(r, 900))
    scanning.value = ''
    toast('已同步银行 9 个账户（演示版：实际接入账户体系后免操作同步）', 'success')
  } else if (ch.action === 'scan') {
    scanning.value = ch.key
    await new Promise((r) => setTimeout(r, 900))
    scanning.value = ''
    toast('已识别他行余额 ¥86,200（演示版：真实环境经银联授权获取）', 'success')
  } else if (ch.action === 'ocr') {
    scanning.value = ch.key
    await new Promise((r) => setTimeout(r, 900))
    scanning.value = ''
    toast('已识别房产证并完成估值 ¥1,200,000（演示版：真实环境接入估价API）', 'success')
  }
}

const submitManual = async () => {
  if (!form.name.trim() || !Number(form.amount) || Number(form.amount) <= 0) {
    toast('请填写资产名称与有效金额', 'error')
    return
  }
  submitting.value = true
  try {
    const res = await importAsset({
      channel: '手动录入',
      name: form.name,
      category: form.category,
      amount: Number(form.amount),
    })
    imported.value = res
    toast('导入成功，资产看板已实时更新', 'success')
  } finally {
    submitting.value = false
  }
}

const goAssets = () => router.push('/assets')
</script>

<template>
  <div class="import-view">
    <BackHeader title="➕ 资产导入" />

    <div class="channel-list">
      <div
        v-for="ch in CHANNELS"
        :key="ch.key"
        class="channel-card"
        :class="{ form: ch.action === 'form' }"
      >
        <div class="c-icon">{{ scanning === ch.key ? '⏳' : ch.icon }}</div>
        <div class="c-body">
          <div class="c-title">{{ ch.title }}</div>
          <div class="c-desc">{{ ch.desc }}</div>

          <!-- 手动录入表单 -->
          <div v-if="ch.action === 'form'" class="manual-form">
            <input v-model="form.name" class="m-input" placeholder="资产名称，如：海外美元存款" />
            <div class="m-row">
              <select v-model="form.category" class="m-select">
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
              <input
                v-model="form.amount"
                type="number"
                class="m-input amount"
                placeholder="金额（元）"
              />
            </div>
            <button class="wm-btn m-btn" :disabled="submitting" @click="submitManual">
              {{ submitting ? '导入中…' : '确认导入' }}
            </button>
          </div>

          <button
            v-else
            class="wm-btn ghost c-btn"
            :disabled="scanning === ch.key"
            @click="onChannel(ch)"
          >
            {{
              ch.action === 'sync' ? '一键同步' : ch.action === 'scan' ? '模拟扫码' : '模拟拍照识别'
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- 导入结果 -->
    <div v-if="imported" class="wm-card result-box">
      <div class="card-title">✅ 导入成功</div>
      <div class="im-row">
        <span>{{ imported.account.name }}</span>
        <b>{{ formatMoney(imported.account.balance) }}</b>
      </div>
      <div class="im-row">
        <span>最新总净资产</span>
        <b class="up">{{ formatMoney(imported.overview.netWorth) }}</b>
      </div>
      <button class="wm-btn wm-btn-block" @click="goAssets">📊 查看资产看板</button>
    </div>

    <div class="import-note">
      🔒 演示版仅「手动录入」真实入账；自动同步/扫码/OCR 为流程模拟，真实环境接入银联授权与 OCR 服务
    </div>
  </div>
</template>

<style scoped>
.import-view {
  padding-bottom: 14px;
}

.channel-list {
  margin: 12px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.channel-card {
  display: flex;
  gap: 11px;
  background: #fff;
  border-radius: var(--radius);
  padding: 13px;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.04);
}

.c-icon {
  font-size: 26px;
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.c-body {
  flex: 1;
  min-width: 0;
}

.c-title {
  font-size: 13px;
  font-weight: 800;
}

.c-desc {
  font-size: 10.5px;
  color: var(--text-sub);
  margin: 2px 0 8px;
}

.c-btn {
  font-size: 11px;
  padding: 7px 14px;
}

.manual-form {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.m-input,
.m-select {
  border: 1px solid #e8ecf0;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  outline: none;
  width: 100%;
}

.m-input:focus,
.m-select:focus {
  border-color: var(--ios-blue);
}

.m-row {
  display: flex;
  gap: 7px;
}

.m-select {
  width: 42%;
  flex-shrink: 0;
}

.amount {
  flex: 1;
}

.m-btn {
  font-size: 12px;
  padding: 8px;
}

.result-box {
  margin-top: 12px;
}

.im-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-sub);
  margin-bottom: 7px;
}

.im-row b {
  color: var(--text-main);
}

.wm-btn-block {
  width: 100%;
  margin-top: 6px;
}

.import-note {
  margin: 10px 16px 0;
  font-size: 9.5px;
  color: #b0b5bd;
  text-align: center;
  line-height: 1.6;
}
</style>
