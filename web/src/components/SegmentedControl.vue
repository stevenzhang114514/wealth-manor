<script setup>
/**
 * iOS 分段控件：灰底圆角容器 + 白色滑动块
 * 用法：<SegmentedControl v-model="tab" :options="[{key,label}]" />
 */
defineProps({
  options: { type: Array, required: true },
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="ios-seg">
    <button
      v-for="o in options"
      :key="o.key"
      class="ios-seg-item"
      :class="{ active: modelValue === o.key }"
      @click="emit('update:modelValue', o.key)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.ios-seg {
  display: flex;
  background: rgba(118, 118, 128, 0.14);
  border-radius: 10px;
  padding: 2px;
  margin: 10px 12px 0;
}

.ios-seg-item {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
  padding: 6px 0;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.ios-seg-item.active {
  background: #fff;
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.12),
    0 1px 1px rgba(0, 0, 0, 0.06);
}
</style>
