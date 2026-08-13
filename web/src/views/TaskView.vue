<script setup>
/**
 * 任务中心：日常/周/月/成就四类任务，领取奖励实时入账
 */
import { onMounted, ref } from 'vue'
import { getTaskList, claimTask } from '../api/tasks.js'
import { useManorStore } from '../stores/manor.js'
import { toast, flyCoin } from '../utils/toast.js'

const manor = useManorStore()
const groups = ref([])
const claiming = ref('')

onMounted(async () => {
  groups.value = await getTaskList()
})

const rewardText = (r) => {
  const parts = []
  if (r.coins) parts.push(`🪙${r.coins}`)
  if (r.exp) parts.push(`⭐${r.exp}`)
  if (r.diamond) parts.push(`💎${r.diamond}`)
  if (r.seed) parts.push(`🌱稀有种子`)
  return parts.join(' ')
}

const onClaim = async (task) => {
  claiming.value = task.id
  try {
    const res = await claimTask(task.id)
    task.status = 'claimed'
    task.claimed = true
    manor.setState(res.manor)
    flyCoin(`+${res.rewards.coins ?? 0} 🪙 +${res.rewards.exp ?? 0} ⭐`)
    toast(`领取成功：${rewardText(res.rewards)} 已入账`, 'success')
  } catch {
    // 错误提示由 http 拦截器统一弹出
  } finally {
    claiming.value = ''
  }
}
</script>

<template>
  <div class="task-view">
    <div class="task-header">
      <div class="t-title">📋 庄园任务</div>
      <div class="t-sub">完成任务引导理财好习惯，奖励金币与庄园经验</div>
    </div>

    <div v-for="g in groups" :key="g.category" class="task-group">
      <div class="group-title">
        {{ g.label }}
        <span v-if="g.tasks.some((t) => t.status === 'claimable')" class="wm-chip warn">
          {{ g.tasks.filter((t) => t.status === 'claimable').length }} 项可领取
        </span>
      </div>

      <div v-for="t in g.tasks" :key="t.id" class="task-row">
        <div class="task-icon">{{ t.icon }}</div>
        <div class="task-body">
          <div class="task-name">{{ t.title }}</div>
          <div class="task-desc">{{ t.desc }}</div>
          <div class="task-progress">
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: Math.min(100, (t.progress / t.target) * 100) + '%' }"
              ></div>
            </div>
            <span class="progress-num">{{ t.progress }}/{{ t.target }}</span>
          </div>
          <div class="task-reward">奖励：{{ rewardText(t.rewards) }}</div>
        </div>
        <div class="task-action">
          <button
            v-if="t.status === 'claimable'"
            class="wm-btn claim-btn"
            :disabled="claiming === t.id"
            @click="onClaim(t)"
          >
            {{ claiming === t.id ? '领取中' : '领取' }}
          </button>
          <span v-else-if="t.status === 'claimed'" class="claimed-tag">✓ 已领取</span>
          <span v-else class="ongoing-tag">进行中</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-view {
  padding-bottom: 14px;
}

.task-header {
  background: #fff;
  padding: 16px 16px 13px;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.05);
}

.t-title {
  font-size: 16px;
  font-weight: 800;
}

.t-sub {
  font-size: 11px;
  color: var(--text-sub);
  margin-top: 3px;
}

.task-group {
  margin: 12px 12px 0;
}

.group-title {
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.task-row {
  display: flex;
  gap: 10px;
  background: #fff;
  border-radius: var(--radius);
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.04);
}

.task-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.task-body {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 13px;
  font-weight: 700;
}

.task-desc {
  font-size: 10.5px;
  color: var(--text-sub);
  margin: 2px 0 6px;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-track {
  flex: 1;
  height: 5px;
  background: #eef0f2;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), #e8a02e);
  border-radius: 999px;
}

.progress-num {
  font-size: 9.5px;
  color: var(--text-sub);
  flex-shrink: 0;
}

.task-reward {
  font-size: 10px;
  color: var(--text-sub);
  margin-top: 5px;
}

.task-action {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.claim-btn {
  font-size: 11.5px;
  padding: 7px 13px;
}

.claimed-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--success);
}

.ongoing-tag {
  font-size: 11px;
  color: var(--text-sub);
}
</style>
