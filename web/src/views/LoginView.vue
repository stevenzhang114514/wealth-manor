<script setup>
/**
 * 登录页（Mock）：手机号一键登录
 * 演示口径：任意 11 位手机号均可登录（本地存 wm-user，路由守卫放行）
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/user.js'
import { toast } from '../utils/toast.js'

const router = useRouter()
const phone = ref('')
const agreed = ref(false)
const loading = ref(false)

const submit = async () => {
  if (!/^1\d{10}$/.test(phone.value)) {
    toast('请输入 11 位有效手机号', 'error')
    return
  }
  if (!agreed.value) {
    toast('请先勾选同意《用户协议》', 'error')
    return
  }
  loading.value = true
  try {
    const res = await login(phone.value)
    localStorage.setItem('wm-user', JSON.stringify(res.user))
    toast(`欢迎回来，${res.user.name}`, 'success')
    router.push('/manor')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-logo">¥</div>
    <div class="login-title">个人理财系统</div>
    <div class="login-subtitle">财富庄园 · 让理财像玩游戏一样简单</div>

    <div class="login-form">
      <div class="phone-box">
        <span class="phone-prefix">+86</span>
        <input
          v-model="phone"
          class="phone-input"
          type="tel"
          maxlength="11"
          placeholder="请输入手机号"
          @keyup.enter="submit"
        />
      </div>

      <button class="wm-btn login-btn" :disabled="loading" @click="submit">
        {{ loading ? '登录中…' : '一键登录' }}
      </button>

      <label class="agree-row">
        <input v-model="agreed" type="checkbox" class="agree-check" />
        <span>我已阅读并同意《用户协议》与《隐私政策》</span>
      </label>
    </div>

    <div class="login-tip">🔓 演示模式：任意 11 位手机号即可登录体验</div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 90px 28px 24px;
  background:
    radial-gradient(120% 60% at 50% 0%, rgba(0, 122, 255, 0.1) 0%, transparent 60%), var(--bg);
}

.login-logo {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  background: linear-gradient(135deg, #007aff, #0055c8);
  color: #fff;
  font-size: 40px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 28px rgba(0, 122, 255, 0.35);
}

.login-title {
  font-size: 24px;
  font-weight: 800;
  margin-top: 18px;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 12.5px;
  color: var(--text-sub);
  margin-top: 6px;
}

.login-form {
  width: 100%;
  margin-top: 44px;
}

.phone-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: var(--r-lg);
  padding: 4px 14px;
  box-shadow: var(--shadow-card);
}

.phone-prefix {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  padding-right: 10px;
  border-right: 0.5px solid var(--separator);
}

.phone-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  padding: 13px 0;
  background: transparent;
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  margin-top: 16px;
}

.agree-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 16px;
  font-size: 10.5px;
  color: var(--text-sub);
  justify-content: center;
}

.agree-check {
  width: 15px;
  height: 15px;
  accent-color: var(--ios-blue);
}

.login-tip {
  margin-top: auto;
  font-size: 10.5px;
  color: var(--text-tert);
  text-align: center;
  line-height: 1.7;
}
</style>
