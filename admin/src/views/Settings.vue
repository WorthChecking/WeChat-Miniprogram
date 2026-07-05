<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">门店设置</h1>
    </div>

    <div class="settings-card">
      <h3 class="section-title">基本信息</h3>
      <div class="form-group">
        <label class="form-label">门店名称</label>
        <input v-model="form.name" class="form-input" placeholder="请输入门店名称" />
      </div>
      <div class="form-group">
        <label class="form-label">门店公告</label>
        <textarea v-model="form.notice" class="form-textarea" placeholder="请输入门店公告" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">联系电话</label>
        <input v-model="form.phone" class="form-input" placeholder="请输入联系电话" />
      </div>
    </div>

    <div class="settings-card">
      <h3 class="section-title">营业设置</h3>
      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">营业开始时间</label>
          <input v-model="form.openTime" class="form-input" type="time" />
        </div>
        <div class="form-group half">
          <label class="form-label">营业结束时间</label>
          <input v-model="form.closeTime" class="form-input" type="time" />
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
      <button class="save-btn" @click="handleSave" :disabled="saving">
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>

    <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
      <div class="logout-modal">
        <p class="logout-modal-text">确认登出？</p>
        <div class="logout-modal-actions">
          <button class="logout-confirm-btn" @click="confirmLogout">确认</button>
          <button class="logout-cancel-btn" @click="showLogoutModal = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStoreInfo, updateStoreInfo, logout } from '@/api/cloud'

const router = useRouter()
const saving = ref(false)
const showLogoutModal = ref(false)

const form = ref({
  name: '',
  notice: '',
  phone: '',
  openTime: '',
  closeTime: ''
})

async function loadSettings() {
  try {
    const info = await getStoreInfo()
    form.value = {
      name: info.name || '',
      notice: info.notice || '',
      phone: info.phone || '',
      openTime: info.openTime || '',
      closeTime: info.closeTime || ''
    }
  } catch {
  }
}

async function handleSave() {
  saving.value = true
  try {
    await updateStoreInfo({ ...form.value })
    alert('保存成功')
  } catch {
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})

function handleLogout() {
  showLogoutModal.value = true
}

async function confirmLogout() {
  await logout()
  router.push('/login')
}
</script>

<style scoped>
.settings-page {
  max-width: 720px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
}

.settings-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.form-group {
  margin-bottom: 16px;
}

.form-group.half {
  flex: 1;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input, .form-textarea {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--white);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus {
  border-color: var(--primary);
}

.form-textarea {
  height: auto;
  padding: 8px 12px;
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-btn {
  padding: 10px 32px;
  background: #E53935;
  color: var(--white);
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.logout-btn:hover { background: #C54C5F; }

.save-btn {
  padding: 10px 32px;
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.save-btn:hover { background: var(--primary-dark); }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.logout-modal {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 32px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.logout-modal-text {
  font-size: 16px;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 24px;
}

.logout-modal-actions {
  display: flex;
  gap: 12px;
}

.logout-confirm-btn {
  flex: 1;
  padding: 10px 0;
  background: #E53935;
  color: #fff;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.logout-confirm-btn:hover { background: #C54C5F; }

.logout-cancel-btn {
  flex: 1;
  padding: 10px 0;
  background: #9E9E9E;
  color: #fff;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.logout-cancel-btn:hover { background: #757575; }
</style>
