<template>
  <div class="login-page">
    <div class="login-left">
      <img src="/login-art.png" alt="Art" class="login-art" />
    </div>
    <div class="login-right">
      <div class="login-card">
        <h2 class="login-title">管理员登录</h2>
        <p class="login-subtitle">请输入账号和密码登录</p>

        <div class="form-group">
          <label class="form-label">账号</label>
          <input
            v-model="form.username"
            class="form-input"
            placeholder="请输入账号"
            maxlength="30"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-with-toggle">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码"
              maxlength="30"
              @keyup.enter="handleLogin"
            />
            <span class="toggle-pwd" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '查看' }}</span>
          </div>
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <button class="login-btn" :disabled="submitting" @click="handleLogin">
          {{ submitting ? '登录中...' : '登录' }}
        </button>

        <div class="login-features">
          <div class="feature-item">
            <span class="feature-check" style="color: var(--success)">✓</span>
            <span>实时订单监控</span>
          </div>
          <div class="feature-item">
            <span class="feature-check" style="color: var(--primary)">✓</span>
            <span>一键出餐核销</span>
          </div>
          <div class="feature-item">
            <span class="feature-check" style="color: var(--primary)">✓</span>
            <span>商品上下架管理</span>
          </div>
        </div>

        <p class="login-footer">© 2025 店铺管理 商户管理系统</p>

        <div class="register-link">
          <span>首次部署请在云开发控制台调用 </span>
          <code class="link-green">initAdmin</code>
          <span> 初始化（详见 README）</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { initCloud, loginWithWechat, callFunction } from '@/api/cloud'

const router = useRouter()
const submitting = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)

const form = reactive({
  username: '',
  password: ''
})

async function handleLogin() {
  if (!form.username.trim()) {
    errorMsg.value = '请输入账号'
    return
  }
  if (!form.password.trim()) {
    errorMsg.value = '请输入密码'
    return
  }

  errorMsg.value = ''
  submitting.value = true

  try {
    initCloud()
    await loginWithWechat()
    var res = await callFunction('loginAdmin', {
      action: 'login',
      username: form.username.trim(),
      password: form.password.trim()
    })

    if (res.success) {
      if (res.token) {
        localStorage.setItem('admin_auth_token', res.token)
      }
      localStorage.setItem('admin_username', res.username || form.username.trim())
      router.push('/')
    } else {
      errorMsg.value = res.errMsg || '登录失败'
    }
  } catch (err) {
    errorMsg.value = '网络异常，请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
}

.login-left {
  flex: 0 0 560px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-art {
  width: 420px;
  height: auto;
  border-radius: var(--radius-lg);
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.login-card {
  width: 440px;
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 48px 40px;
  box-shadow: 12px 12px 0 var(--text-muted);
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--primary);
}

.input-with-toggle {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-toggle .form-input {
  padding-right: 60px;
}

.toggle-pwd {
  position: absolute;
  right: 14px;
  font-size: 13px;
  color: var(--primary);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}

.toggle-pwd:hover {
  color: var(--primary-dark);
}

.error-text {
  font-size: 13px;
  color: var(--danger);
  margin-bottom: 12px;
  text-align: center;
}

.login-btn {
  width: 100%;
  height: 46px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 20px;
}

.login-btn:hover {
  opacity: 0.9;
}

.login-btn[disabled] {
  opacity: 0.55;
  cursor: not-allowed;
}

.login-features {
  margin-bottom: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.feature-check {
  font-weight: 700;
}

.login-footer {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.register-link {
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 12px;
}

.link-green {
  color: #52c41a;
  text-decoration: none;
  font-weight: 600;
}

.link-green:hover {
  text-decoration: underline;
}
</style>
