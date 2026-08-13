<script setup>
/**
 * 手机框演示壳：375×812 模拟工行APP内嵌模块
 * 内含状态栏 + 内容滚动区 + 底部 Tab（路由 meta.hideTab 时隐藏，如新手引导）
 */
import { useRoute } from 'vue-router'
import TabBar from './TabBar.vue'

const route = useRoute()
</script>

<template>
  <div class="phone-frame">
    <div class="phone-notch"></div>
    <div class="phone-screen">
      <div class="phone-statusbar">
        <span>9:41</span>
        <span>ICBC · 财富庄园</span>
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
