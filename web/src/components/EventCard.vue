<script setup>
/**
 * 事件卡：经济周期 / 政策变化 / 生活事件 三类事件的展示卡
 */
defineProps({
  event: { type: Object, default: null },
})

const TYPE_LABELS = {
  econ: { label: '经济周期', color: '#ff9500' },
  policy: { label: '政策变化', color: '#007aff' },
  life: { label: '生活事件', color: '#34c759' },
}
</script>

<template>
  <div v-if="event" class="event-card">
    <div class="ec-head">
      <span class="ec-icon">{{ event.icon }}</span>
      <div class="ec-title">
        <div class="ec-name">{{ event.title }}</div>
        <span class="ec-type" :style="{ color: TYPE_LABELS[event.type]?.color }">
          {{ TYPE_LABELS[event.type]?.label }}
        </span>
      </div>
    </div>
    <div class="ec-desc">{{ event.desc }}</div>
  </div>
</template>

<style scoped>
.event-card {
  background: linear-gradient(135deg, #fdf6ec, #fef9f0);
  border: 1px solid #f5e3c2;
  border-radius: var(--r-lg);
  padding: 12px;
  margin: 10px 12px 0;
  box-shadow: var(--shadow-card);
  animation: ecIn 0.35s ease both;
}

@keyframes ecIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ec-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.ec-icon {
  font-size: 22px;
}

.ec-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
}

.ec-name {
  font-size: 13px;
  font-weight: 800;
}

.ec-type {
  font-size: 9.5px;
  font-weight: 700;
  background: #fff;
  padding: 1px 8px;
  border-radius: 999px;
}

.ec-desc {
  font-size: 11px;
  line-height: 1.6;
  color: #6d5b3a;
}
</style>
