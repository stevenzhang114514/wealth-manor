<script setup>
/**
 * 子页面顶部栏：返回按钮 + 标题（商城/好友/AI助手等页面共用）
 */
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, default: '' },
})

const router = useRouter()
const back = () => router.back()
</script>

<template>
  <div class="back-header">
    <button class="back-btn" @click="back">‹</button>
    <span class="back-title">{{ title }}</span>
    <span class="back-right"><slot name="right"></slot></span>
  </div>
</template>

<style scoped>
.back-header {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 10px 14px;
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.05);
}

.back-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #f2f3f5;
  font-size: 18px;
  line-height: 1;
  color: var(--text-main);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-title {
  font-size: 15px;
  font-weight: 800;
}

.back-right {
  margin-left: auto;
}
</style>
