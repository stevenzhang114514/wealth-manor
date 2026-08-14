<script setup>
/**
 * 响应式演示壳：
 *   - 移动端（<768px）：全屏 100dvh，无边框，状态栏含安全区
 *   - 平板/桌面：375×812 手机框居中，视口高度不足时按比例整体缩放
 * 路由 meta.hideTab 时隐藏底部导航（登录/新手引导）
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './TabBar.vue'

const route = useRoute()
const scale = ref(1)

const updateScale = () => {
  if (window.innerWidth < 768) {
    scale.value = 1
    return
  }
  // 可用高度（预留上下边距）÷ 手机框自然高度（含边框）
  const available = window.innerHeight - 40
  const natural = 812 + 20
  scale.value = Math.min(1, available / natural)
}

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScale)
})
</script>

<template>
  <div class="phone-frame scaled" :style="{ '--scale': scale }">
    <div class="phone-notch"></div>
    <div class="phone-screen">
      <div class="phone-statusbar">
        <span>9:41</span>
        <span>个人理财系统</span>
        <span>📶 100%</span>
      </div>
      <div class="phone-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <TabBar v-if="!route.meta.hideTab" />
    </div>
  </div>
</template>
