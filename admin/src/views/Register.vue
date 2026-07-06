<template>
  <div class="register-page">
    <div class="login-left">
      <img src="/login-art.png" alt="Art" class="login-art" />
    </div>
    <div class="login-right">
      <div class="register-card">
        <h2 class="register-title">管理员注册</h2>
        <p class="register-subtitle">注册管理员账号（需已登录管理员授权）</p>

        <div class="form-group">
          <label class="form-label">账号</label>
          <input
            v-model="form.username"
            class="form-input"
            :class="{ 'form-input-error': usernameError }"
            placeholder="请输入账号"
            maxlength="30"
            @input="onUsernameInput"
          />
          <p v-if="usernameError" class="field-error">{{ usernameError }}</p>
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
            />
            <span class="toggle-pwd" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '查看' }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <div class="input-with-toggle">
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPwd ? 'text' : 'password'"
              class="form-input"
              placeholder="请再次输入密码"
              maxlength="30"
            />
            <span class="toggle-pwd" @click="showConfirmPwd = !showConfirmPwd">{{ showConfirmPwd ? '隐藏' : '查看' }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">验证码</label>
          <div class="captcha-row">
            <input
              v-model="form.captcha"
              class="form-input captcha-input"
              placeholder="请输入验证码"
              maxlength="4"
              @keyup.enter="handleRegister"
            />
            <canvas ref="captchaCanvas" class="captcha-canvas" width="120" height="40" @click="refreshCaptcha"></canvas>
          </div>
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <button class="register-btn" :disabled="submitting" @click="handleRegister">
          {{ submitting ? '注册中...' : '注册' }}
        </button>

        <div class="back-link">
          <span>已有账号？</span>
          <router-link to="/login" class="link-green">返回登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { initCloud, loginWithWechat, callFunction } from '@/api/cloud'

const router = useRouter()
const captchaCanvas = ref(null)
const submitting = ref(false)
const errorMsg = ref('')
const usernameError = ref('')
const showPassword = ref(false)
const showConfirmPwd = ref(false)
var currentCaptcha = ''

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

onMounted(function() {
  initCloud()
  refreshCaptcha()
})

function onUsernameInput() {
  var val = form.username
  var invalid = /[^a-zA-Z0-9]/
  if (invalid.test(val)) {
    usernameError.value = '账号只能由字母或数字组成'
  } else {
    usernameError.value = ''
  }
}

function refreshCaptcha() {
  var canvas = captchaCanvas.value
  if (!canvas) return
  var ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, 120, 40)

  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  currentCaptcha = ''
  for (var i = 0; i < 4; i++) {
    currentCaptcha += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  for (var j = 0; j < currentCaptcha.length; j++) {
    ctx.font = 'bold 24px Arial'
    ctx.fillStyle = ['#333', '#EE7B5F', '#6C99C2', '#8CB782'][j % 4]
    ctx.save()
    ctx.translate(18 + j * 26, 28)
    ctx.rotate((Math.random() - 0.5) * 0.5)
    ctx.fillText(currentCaptcha[j], 0, 0)
    ctx.restore()
  }

  for (var k = 0; k < 4; k++) {
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.beginPath()
    ctx.moveTo(Math.random() * 120, Math.random() * 40)
    ctx.lineTo(Math.random() * 120, Math.random() * 40)
    ctx.stroke()
  }
}

async function handleRegister() {
  var hasToken = !!localStorage.getItem('admin_auth_token')
  if (!hasToken) {
    errorMsg.value = '请先登录管理员账号后再注册新管理员'
    return
  }
  if (!form.username.trim()) {
    errorMsg.value = '请输入账号'
    return
  }
  if (/[^a-zA-Z0-9]/.test(form.username.trim())) {
    usernameError.value = '账号只能由字母或数字组成'
    errorMsg.value = '账号只能由字母或数字组成'
    return
  }
  if (!form.password.trim()) {
    errorMsg.value = '请输入密码'
    return
  }
  if (form.password !== form.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  if (!form.captcha.trim()) {
    errorMsg.value = '请输入验证码'
    return
  }
  if (form.captcha.toUpperCase() !== currentCaptcha.toUpperCase()) {
    errorMsg.value = '验证码错误'
    refreshCaptcha()
    form.captcha = ''
    return
  }

  errorMsg.value = ''
  submitting.value = true

  try {
    initCloud()
    await loginWithWechat()
    var res = await callFunction('loginAdmin', {
      action: 'register',
      username: form.username.trim(),
      password: form.password.trim()
    })

    if (res.success) {
      showToast('注册成功', function() {
        router.push('/login')
      })
    } else if (res.alreadyExists) {
      errorMsg.value = '该账号已被注册'
    } else {
      errorMsg.value = res.errMsg || '注册失败，请重试'
    }
  } catch (err) {
    errorMsg.value = '网络异常，请重试'
  } finally {
    submitting.value = false
  }
}

function showToast(msg, callback) {
  var el = document.createElement('div')
  el.className = 'toast-overlay'
  el.innerHTML = '<div class="toast-box">' + msg + '</div>'
  document.body.appendChild(el)
  setTimeout(function() {
    document.body.removeChild(el)
    if (callback) callback()
  }, 800)
}
</script>

<style scoped>
.register-page {
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

.register-card {
  width: 440px;
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 48px 40px;
  box-shadow: 12px 12px 0 var(--text-muted);
}

.register-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 8px;
}

.register-subtitle {
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

.form-input-error {
  border-color: var(--danger);
}

.form-input-error:focus {
  border-color: var(--danger);
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

.field-error {
  font-size: 12px;
  color: var(--danger);
  margin-top: 6px;
  margin-bottom: 0;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input {
  flex: 1;
}

.captcha-canvas {
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  flex-shrink: 0;
}

.error-text {
  font-size: 13px;
  color: var(--danger);
  margin-bottom: 12px;
  text-align: center;
}

.register-btn {
  width: 100%;
  height: 46px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
}

.register-btn:hover {
  opacity: 0.9;
}

.register-btn[disabled] {
  opacity: 0.55;
  cursor: not-allowed;
}

.back-link {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
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

<style>
.toast-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  background: rgba(0,0,0,0.3);
}

.toast-box {
  padding: 16px 32px;
  background: rgba(0,0,0,0.75);
  color: #fff;
  border-radius: 8px;
  font-size: 15px;
}
</style>
