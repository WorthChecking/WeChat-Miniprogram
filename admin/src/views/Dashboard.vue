<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">数据看板</h1>
      <span class="page-date">{{ currentDate }}</span>
    </div>

    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-label">{{ stat.label }}</span>
        <span class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</span>
        <span v-if="stat.change" class="stat-change">{{ stat.change }}</span>
      </div>
    </div>

    <div class="content-grid">
      <div class="card orders-card">
        <div class="card-header">
          <h3 class="card-title">待处理订单</h3>
          <router-link to="/orders" class="card-link">查看全部 →</router-link>
        </div>
        <div class="order-list">
          <div v-if="pendingOrders.length === 0" class="empty-state">暂无待处理订单</div>
          <div v-for="order in pendingOrders" :key="order._id" class="order-item">
            <div class="order-top">
              <span class="order-no">{{ order.orderNo }}</span>
              <span class="order-type">{{ order.type === 'dine-in' ? '堂食·' + order.tableNo : '自提' }}</span>
              <span class="status-pill" :class="statusClass(order.status)">{{ statusText(order.status) }}</span>
              <span class="order-price">¥{{ order.totalPrice }}</span>
            </div>
            <div class="order-bottom">
              <span class="order-items">{{ order.items.map(i => i.name + '×' + i.quantity).join(' | ') }}</span>
              <button class="action-btn" :class="order.status === 'making' ? 'btn-primary' : 'btn-success'" @click="handleAction(order)">
                {{ order.status === 'making' ? '出餐' : '核销' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card top-goods-card">
        <div class="card-header">
          <h3 class="card-title">热门商品 TOP5</h3>
        </div>
        <div class="top-list">
          <div v-for="(goods, idx) in topGoods" :key="idx" class="top-item">
            <div class="top-info">
              <span class="top-rank">{{ idx + 1 }}. {{ goods.name }}</span>
              <span class="top-sales">{{ goods.sales }}单</span>
            </div>
            <div class="top-bar-bg">
              <div class="top-bar-fill" :style="{ width: goods.barWidth + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getOrders, updateOrderStatus, getGoods, watchOrders } from '@/api/cloud'

const currentDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
const pendingOrders = ref([])
const topGoods = ref([])
let watcher = null

const stats = ref([
  { label: '今日订单', value: '0', change: '', color: 'var(--primary)' },
  { label: '今日营收', value: '¥0', change: '', color: 'var(--success)' },
  { label: '制作中', value: '0', change: '', color: 'var(--warning)' },
  { label: '待取餐', value: '0', change: '', color: 'var(--info)' }
])

function statusText(status) {
  const map = { making: '制作中', pickup: '待取餐', completed: '已完成', canceled: '已取消' }
  return map[status] || status
}

function statusClass(status) {
  const map = { making: 'pill-warning', pickup: 'pill-info', completed: 'pill-success', canceled: 'pill-danger' }
  return map[status] || ''
}

async function loadStats() {
  try {
    const db = (await import('@/api/cloud')).getDb()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayOrdersRes = await db.collection('orders').where({
      createTime: db.command.gte(today)
    }).count()
    
    const completedOrdersRes = await db.collection('orders').where({
      createTime: db.command.gte(today),
      status: 'completed'
    }).get()
    
    const makingRes = await db.collection('orders').where({ status: 'making' }).count()
    const pickupRes = await db.collection('orders').where({ status: 'pickup' }).count()
    
    let revenue = 0
    if (completedOrdersRes.data) {
      revenue = completedOrdersRes.data.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
    }
    
    stats.value = [
      { label: '今日订单', value: String(todayOrdersRes.total || 0), change: '', color: 'var(--primary)' },
      { label: '今日营收', value: '¥' + revenue.toFixed(2), change: '', color: 'var(--success)' },
      { label: '制作中', value: String(makingRes.total || 0), change: '', color: 'var(--warning)' },
      { label: '待取餐', value: String(pickupRes.total || 0), change: '', color: 'var(--info)' }
    ]
  } catch {
    stats.value = [
      { label: '今日订单', value: '0', change: '', color: 'var(--primary)' },
      { label: '今日营收', value: '¥0', change: '', color: 'var(--success)' },
      { label: '制作中', value: '0', change: '', color: 'var(--warning)' },
      { label: '待取餐', value: '0', change: '', color: 'var(--info)' }
    ]
  }
}

async function loadPendingOrders() {
  try {
    const res = await getOrders('making', 1, 10)
    pendingOrders.value = res.data || []
    const pickupRes = await getOrders('pickup', 1, 10)
    pendingOrders.value = [...pendingOrders.value, ...(pickupRes.data || [])]
  } catch {
    pendingOrders.value = []
  }
}

async function loadTopGoods() {
  try {
    const goods = await getGoods()
    const sorted = [...goods].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5)
    const maxSales = sorted[0] ? sorted[0].sales || 0 : 1
    topGoods.value = sorted.map(g => ({
      name: g.name,
      sales: g.sales || 0,
      barWidth: ((g.sales || 0) / maxSales) * 100
    }))
  } catch {
    topGoods.value = []
  }
}

async function handleAction(order) {
  const newStatus = order.status === 'making' ? 'pickup' : 'completed'
  const label = newStatus === 'pickup' ? '出餐' : '核销'
  if (!window.confirm('确认' + label + '？')) return
  try {
    await updateOrderStatus(order._id, newStatus)
    await loadPendingOrders()
    await loadStats()
  } catch {
    alert('操作失败，请重试')
  }
}

function startWatcher() {
  watcher = watchOrders(() => {
    loadPendingOrders()
    loadStats()
    loadTopGoods()
  })
}

onMounted(() => {
  loadStats()
  loadPendingOrders()
  loadTopGoods()
  startWatcher()
})

onUnmounted(() => {
  if (watcher && watcher.close) watcher.close()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 22px 20px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
}

.stat-change {
  display: block;
  font-size: 12px;
  color: var(--success);
  margin-top: 4px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-link {
  font-size: 12px;
  color: var(--primary);
  text-decoration: none;
}

.order-item {
  padding: 12px 0;
  border-top: 1px solid var(--border);
}

.order-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.order-no {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.order-type {
  font-size: 12px;
  color: var(--text-secondary);
}

.status-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--white);
}

.pill-warning { background: var(--warning); }
.pill-info { background: var(--info); }
.pill-success { background: var(--success); }
.pill-danger { background: var(--danger); }

.order-price {
  margin-left: auto;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-items {
  font-size: 11px;
  color: var(--text-muted);
}

.action-btn {
  padding: 4px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--white);
  transition: opacity 0.2s;
}

.action-btn:hover { opacity: 0.85; }

.btn-primary { background: var(--primary); }
.btn-success { background: var(--success); }

.empty-state {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 14px;
}

.top-item {
  margin-bottom: 16px;
}

.top-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.top-rank {
  font-size: 14px;
  color: var(--text-primary);
}

.top-sales {
  font-size: 14px;
  color: var(--text-secondary);
}

.top-bar-bg {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.top-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 4px;
  transition: width 0.5s;
}
</style>
