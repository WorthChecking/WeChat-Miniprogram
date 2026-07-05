<template>
  <div class="confirm-page">
    <div class="confirm-card">
      <div v-if="status === 'loading'" class="center">
        <div class="spinner"></div>
        <p>验证中...</p>
      </div>

      <div v-else-if="status === 'input'" class="form">
        <h2 class="title">商家后台登录确认</h2>
        <p class="desc">请输入您的微信号以确认登录</p>
        <input v-model="wechatId" class="input" placeholder="请输入微信号" @keyup.enter="handleConfirm" />
        <button class="btn" :disabled="submitting || !wechatId.trim()" @click="handleConfirm">
          {{ submitting ? '确认中...' : '确认登录' }}
        </button>
      </div>

      <div v-else-if="status === 'success'" class="center">
        <div class="icon success">✓</div>
        <h2 class="result-title">登录成功</h2>
        <p class="result-desc">商家后台已授权登录，可关闭此页面</p>
      </div>

      <div v-else class="center">
        <div class="icon fail">✕</div>
        <h2 class="result-title fail-text">验证失败</h2>
        <p class="result-desc">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { initCloud, callFunction } from '@/api/cloud'

const route = useRoute()
const status = ref('loading')
const wechatId = ref('')
const submitting = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    status.value = 'fail'
    errorMsg.value = '无效的登录链接'
    return
  }
  status.value = 'input'
})

async function handleConfirm() {
  if (submitting.value || !wechatId.value.trim()) return
  submitting.value = true

  try {
    initCloud()
    const res = await callFunction('loginAdmin', {
      action: 'confirm',
      loginCode: route.query.code,
      wechatId: wechatId.value.trim()
    })

    if (res.success) {
      status.value = 'success'
    } else if (res.notAdmin) {
      status.value = 'fail'
      errorMsg.value = '该账号未注册为管理员'
    } else {
      status.value = 'fail'
      errorMsg.value = res.errMsg || '操作失败'
    }
  } catch (err) {
    status.value = 'fail'
    errorMsg.value = '网络错误，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.confirm-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.confirm-card {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e8e8e8;
  border-top-color: #6C99C2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.input {
  width: 100%;
  height: 40px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  margin-bottom: 20px;
  outline: none;
}

.input:focus {
  border-color: #6C99C2;
}

.btn {
  width: 100%;
  height: 40px;
  background: #6C99C2;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
}

.btn:disabled {
  background: #bfbfbf;
  cursor: not-allowed;
}

.icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.icon.success {
  color: #52c41a;
}

.icon.fail {
  color: #ff4d4f;
}

.result-title {
  font-size: 20px;
  font-weight: 700;
  color: #52c41a;
  margin-bottom: 8px;
}

.result-title.fail-text {
  color: #ff4d4f;
}

.result-desc {
  font-size: 14px;
  color: #999;
}
</style>
