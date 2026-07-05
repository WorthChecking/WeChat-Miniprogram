<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <img src="/sidebar-logo.jpg" alt="Logo" class="logo-icon" />
        <span class="logo-text">店铺管理商家平台</span>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: currentPath === item.path }"
        >
          <img :src="item.icon" class="nav-icon" alt="" />
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-divider"></div>
        <div class="store-status-label">门店状态</div>
        <div class="store-toggle" @click="toggleStore">
          <div class="toggle-track" :class="{ on: storeOpen }">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-text" :style="{ color: storeOpen ? 'var(--success)' : 'var(--danger)' }">
            {{ storeOpen ? '营业中' : '已歇业' }}
          </span>
        </div>
        <div class="cloud-status" :class="cloudConnected ? 'connected' : 'disconnected'" :title="cloudConnected ? '云环境已连接' : '云环境未连接'">
          <span class="status-dot"></span>
          <span class="status-text">{{ cloudConnected ? '已连接' : '未连接' }}</span>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getStoreInfo, updateStoreInfo, testConnection } from '@/api/cloud'

const route = useRoute()
const storeOpen = ref(true)
const cloudConnected = ref(false)

const currentPath = computed(() => route.path)

const navItems = [
  { path: '/', label: '数据看板', icon: '/icons/dashboard.png' },
  { path: '/orders', label: '订单管理', icon: '/icons/orders.png' },
  { path: '/goods', label: '商品管理', icon: '/icons/goods.png' },
  { path: '/coupons', label: '优惠券管理', icon: '/icons/goods.png' },
  { path: '/settings', label: '门店设置', icon: '/icons/settings.png' },
  { path: '/table-codes', label: '桌码管理', icon: '/icons/table-codes.png' }
]

async function loadStoreStatus() {
  try {
    const info = await getStoreInfo()
    storeOpen.value = info.status === 'open'
  } catch {
    storeOpen.value = true
  }
}

async function checkCloudConnection() {
  const res = await testConnection()
  cloudConnected.value = res.success
  if (res.success) {
    console.log('云环境连接成功:', res.env)
  } else {
    console.error('云环境连接失败:', res.error)
  }
}

async function toggleStore() {
  const newStatus = storeOpen.value ? 'closed' : 'open'
  const confirmed = window.confirm(
    newStatus === 'closed' ? '确认关闭门店？关闭后顾客将无法下单' : '确认开启门店？'
  )
  if (!confirmed) return
  try {
    await updateStoreInfo({ status: newStatus })
    storeOpen.value = !storeOpen.value
  } catch {
    alert('操作失败，请重试')
  }
}

onMounted(() => {
  loadStoreStatus()
  checkCloudConnection()
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 24px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.logo-text {
  color: var(--white);
  font-size: 16px;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 10px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--radius);
  color: #B0B0B0;
  font-size: 14px;
  transition: all 0.2s;
  text-decoration: none;
  margin-bottom: 4px;
}

.nav-item:hover {
  background: var(--sidebar-hover);
  color: var(--white);
}

.nav-item.active {
  background: var(--sidebar-hover);
  color: var(--white);
  position: relative;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  right: 0;
  top: 8px;
  bottom: 8px;
  width: 4px;
  background: var(--primary);
  border-radius: 2px 0 0 2px;
}

.nav-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 0 24px 24px;
}

.sidebar-divider {
  height: 1px;
  background: #334155;
  margin-bottom: 16px;
}

.store-status-label {
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 12px;
}

.store-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-track {
  width: 48px;
  height: 26px;
  background: #475569;
  border-radius: 13px;
  position: relative;
  transition: background 0.3s;
}

.toggle-track.on {
  background: var(--success);
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: var(--white);
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.3s;
}

.toggle-track.on .toggle-thumb {
  transform: translateX(22px);
}

.toggle-text {
  font-size: 12px;
  font-weight: 600;
}

.cloud-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cloud-status.connected .status-dot {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
}

.cloud-status.disconnected .status-dot {
  background: var(--danger);
  box-shadow: 0 0 6px var(--danger);
}

.status-text {
  font-size: 11px;
  color: #94A3B8;
  font-weight: 500;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 28px;
  min-height: 100vh;
}
</style>
