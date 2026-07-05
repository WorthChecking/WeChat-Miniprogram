<template>
  <div class="orders-page">
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
      <div class="header-actions">
        <template v-if="batchMode">
          <button class="batch-del-btn" @click="handleBatchDelete" :disabled="selectedIds.length === 0">删除</button>
          <button class="batch-cancel-btn" @click="exitBatchMode">取消</button>
        </template>
        <template v-else>
          <button class="edit-btn-header" @click="enterBatchMode">编辑</button>
        </template>
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}({{ tab.count }})
      </button>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索订单号/桌号..."
          @input="handleSearch"
        />
      </div>
      <button class="filter-btn" @click="showFilter = !showFilter">筛选 ▾</button>
    </div>

    <div class="table-wrapper">
      <table class="order-table">
        <thead>
          <tr>
            <th v-if="batchMode" class="cell-check">
              <span class="checkbox" :class="{ checked: isAllSelected }" @click="toggleSelectAll"></span>
            </th>
            <th>订单编号</th>
            <th>类型</th>
            <th>金额</th>
            <th>商品</th>
            <th>下单时间</th>
            <th>状态</th>
            <th>备注</th>
            <th v-if="!batchMode">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="batchMode ? 9 : 8" class="loading-cell">加载中...</td>
          </tr>
          <tr v-else-if="filteredOrders.length === 0">
            <td :colspan="batchMode ? 9 : 8" class="empty-cell">暂无订单</td>
          </tr>
          <tr v-for="order in filteredOrders" :key="order._id" class="order-row" :class="{ 'row-selected': selectedIds.includes(order._id) }" @click="batchMode && toggleSelect(order._id)">
            <td v-if="batchMode" class="cell-check">
              <span class="checkbox" :class="{ checked: selectedIds.includes(order._id) }"></span>
            </td>
            <td class="cell-mono">{{ order.orderNo }}</td>
            <td>
              <span v-if="order.type === 'dine-in'">堂食·{{ order.tableNo }}</span>
              <span v-else>
                <span>自提</span>
                <span v-if="order.pickupCode" class="pickup-code">取餐码: {{ order.pickupCode }}</span>
              </span>
            </td>
            <td class="cell-price">¥{{ order.totalPrice }}</td>
            <td class="cell-items">
              <div v-for="(i, idx) in order.items" :key="idx" class="item-row">
                <span>{{ i.name }}×{{ i.quantity }}</span>
                <span class="item-specs-tag" v-if="i.specs">{{ i.specs }}</span>
              </div>
            </td>
            <td class="cell-time">{{ formatTime(order.createTime) }}</td>
            <td>
              <span class="status-pill" :class="statusClass(order.status)">{{ statusText(order.status) }}</span>
            </td>
            <td class="cell-remark">
              <span v-if="order.remark" class="remark-tag">{{ order.remark }}</span>
              <span v-else class="remark-empty">-</span>
            </td>
            <td v-if="!batchMode" class="cell-actions">
              <button v-if="order.status === 'making'" class="action-btn btn-primary" @click="handleComplete(order)">出餐</button>
              <button v-if="order.status === 'pickup' && order.type !== 'dine-in'" class="action-btn btn-success" @click="handleVerify(order)">核销</button>
              <button v-if="order.status === 'making' || (order.status === 'pickup' && order.type !== 'dine-in')" class="action-btn btn-danger" @click="handleCancel(order)">取消</button>
              <button v-if="order.status === 'making' || (order.status === 'pickup' && order.type !== 'dine-in')" class="action-btn btn-info" @click="viewDetail(order)">详情</button>
              <button v-if="order.status === 'completed' || order.status === 'canceled'" class="action-btn btn-info" @click="viewDetail(order)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <span class="page-info">共 {{ total }} 条记录</span>
      <div class="page-btns">
        <button class="page-btn" :disabled="page <= 1" @click="page--">‹</button>
        <button
          v-for="p in displayPages"
          :key="p"
          class="page-btn"
          :class="{ active: p === page }"
          @click="page = p"
        >{{ p }}</button>
        <button class="page-btn" :disabled="page >= totalPages" @click="page++">›</button>
      </div>
    </div>

    <div v-if="detailOrder" class="modal-overlay" @click.self="detailOrder = null">
      <div class="modal-card">
        <div class="modal-header">
          <h3>订单详情</h3>
          <button class="modal-close" @click="detailOrder = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">订单编号</span>
            <span class="detail-value">{{ detailOrder.orderNo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">订单类型</span>
            <span class="detail-value">
              <span v-if="detailOrder.type === 'dine-in'">堂食·{{ detailOrder.tableNo }}</span>
              <span v-else>
                <span>自提</span>
                <span v-if="detailOrder.pickupCode" class="pickup-code-inline">取餐码: {{ detailOrder.pickupCode }}</span>
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">订单状态</span>
            <span class="status-pill" :class="statusClass(detailOrder.status)">{{ statusText(detailOrder.status) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">下单时间</span>
            <span class="detail-value">{{ formatTime(detailOrder.createTime) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">商品明细</span>
          </div>
          <div class="detail-items">
            <div v-for="(item, idx) in detailOrder.items" :key="idx" class="detail-item">
              <div class="detail-item-info">
                <span class="detail-item-name">{{ item.name }}</span>
                <span class="detail-item-specs" v-if="item.specs">{{ item.specs }}</span>
              </div>
              <span>×{{ item.quantity }}</span>
              <span>¥{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
          <div class="detail-total">
            <span>合计</span>
            <span class="total-price">¥{{ detailOrder.totalPrice }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getOrders, updateOrderStatus, cancelAndRefund, deleteOrder } from '@/api/cloud'
import { getDb } from '@/api/cloud'

const currentTab = ref('all')
const keyword = ref('')
const orders = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const detailOrder = ref(null)
const showFilter = ref(false)
const batchMode = ref(false)
const selectedIds = ref([])

const tabCounts = ref({ all: 0, making: 0, pickup: 0, completed: 0, canceled: 0 })

let orderWatcher = null

const tabs = computed(() => [
  { label: '全部', value: 'all', count: tabCounts.value.all },
  { label: '制作中', value: 'making', count: tabCounts.value.making },
  { label: '待取餐', value: 'pickup', count: tabCounts.value.pickup },
  { label: '已完成', value: 'completed', count: tabCounts.value.completed },
  { label: '已取消', value: 'canceled', count: tabCounts.value.canceled }
])

const totalPages = computed(() => Math.ceil(total.value / pageSize))

const displayPages = computed(() => {
  const pages = []
  const max = Math.min(totalPages.value, 5)
  for (let i = 1; i <= max; i++) pages.push(i)
  return pages
})

const filteredOrders = computed(() => {
  if (!keyword.value) return orders.value
  const kw = keyword.value.toLowerCase()
  return orders.value.filter(o =>
    o.orderNo.toLowerCase().includes(kw) ||
    (o.tableNo && o.tableNo.toLowerCase().includes(kw))
  )
})

const isAllSelected = computed(() => {
  return filteredOrders.value.length > 0 && filteredOrders.value.every(o => selectedIds.value.includes(o._id))
})

function enterBatchMode() {
  batchMode.value = true
  selectedIds.value = []
}

function exitBatchMode() {
  batchMode.value = false
  selectedIds.value = []
}

function toggleSelect(id) {
  var idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredOrders.value.map(o => o._id)
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  if (!window.confirm('确认删除选中的 ' + selectedIds.value.length + ' 个订单？')) return
  try {
    for (var i = 0; i < selectedIds.value.length; i++) {
      await deleteOrder(selectedIds.value[i])
    }
    exitBatchMode()
    await loadOrders()
    await loadTabCounts()
  } catch {
    alert('删除失败')
  }
}

function statusText(status) {
  const map = { making: '制作中', pickup: '待取餐', completed: '已完成', canceled: '已取消' }
  return map[status] || status
}

function statusClass(status) {
  const map = { making: 'pill-warning', pickup: 'pill-info', completed: 'pill-success', canceled: 'pill-danger' }
  return map[status] || ''
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function loadOrders() {
  loading.value = true
  try {
    const res = await getOrders(currentTab.value, page.value, pageSize)
    orders.value = res.data || []
    total.value = res.total || 0
  } catch {
    orders.value = []
  } finally {
    loading.value = false
  }
}

async function loadTabCounts() {
  try {
    const db = (await import('@/api/cloud')).getDb()
    const statuses = ['making', 'pickup', 'completed', 'canceled']
    const counts = { all: 0, making: 0, pickup: 0, completed: 0, canceled: 0 }
    for (const s of statuses) {
      const res = await db.collection('orders').where({ status: s }).count()
      counts[s] = res.total
      counts.all += res.total
    }
    tabCounts.value = counts
  } catch {
    // ignore
  }
}

function switchTab(tab) {
  currentTab.value = tab
  page.value = 1
  loadOrders()
}

function handleSearch() {
  // client-side filter via computed
}

async function handleComplete(order) {
  var isDineIn = (order.type === 'dine-in')
  var targetStatus = isDineIn ? 'completed' : 'pickup'
  try {
    await updateOrderStatus(order._id, targetStatus)
    await loadOrders()
    await loadTabCounts()
  } catch {
    alert('操作失败')
  }
}

async function handleVerify(order) {
  try {
    await updateOrderStatus(order._id, 'completed')
    await loadOrders()
    await loadTabCounts()
  } catch {
    alert('操作失败')
  }
}

async function handleCancel(order) {
  if (!window.confirm('确认取消订单并退款？此操作不可撤销！')) return
  try {
    await cancelAndRefund(order._id)
    await loadOrders()
    await loadTabCounts()
  } catch {
    alert('操作失败')
  }
}

function viewDetail(order) {
  detailOrder.value = order
}

watch(page, () => loadOrders())

function startOrderWatcher() {
  stopOrderWatcher()
  var database = getDb()
  orderWatcher = database.collection('orders').where({}).watch({
    onChange: function(snapshot) {
      if (snapshot.docChanges && snapshot.docChanges.length > 0) {
        loadOrders()
        loadTabCounts()
      }
    },
    onError: function(err) {
      console.error('订单监听错误:', err)
    }
  })
}

function stopOrderWatcher() {
  if (orderWatcher) {
    orderWatcher.close()
    orderWatcher = null
  }
}

onMounted(() => {
  loadOrders()
  loadTabCounts()
  startOrderWatcher()
})

onUnmounted(() => {
  stopOrderWatcher()
})
</script>

<style scoped>
.orders-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.edit-btn-header {
  padding: 8px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  transition: border-color 0.2s;
}

.edit-btn-header:hover { border-color: var(--primary); color: var(--primary); }

.batch-del-btn {
  padding: 8px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  background: #E53935;
  color: var(--white);
  transition: opacity 0.2s;
}

.batch-del-btn:hover { opacity: 0.85; }
.batch-del-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.batch-cancel-btn {
  padding: 8px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  background: #9E9E9E;
  color: var(--white);
  transition: opacity 0.2s;
}

.batch-cancel-btn:hover { opacity: 0.85; }

.cell-check {
  width: 40px;
  text-align: center;
}

.checkbox {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-radius: 4px;
  vertical-align: middle;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox.checked {
  background: var(--primary);
  border-color: var(--primary);
}

.checkbox.checked::after {
  content: '✓';
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  font-size: 11px;
  font-weight: 700;
}

.row-selected {
  background: #fff7ed !important;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  color: var(--text-secondary);
  background: transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--border);
}

.tab-btn.active {
  background: var(--primary);
  color: var(--white);
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  position: relative;
  width: 300px;
  height: 38px;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  color: #9e9ea7;
}

.search-input {
  flex: 1;
  height: 100%;
  padding: 0 12px 0 36px;
  border: 2px solid transparent;
  border-radius: 8px;
  outline: none;
  background-color: #f3f3f4;
  color: #0d0c22;
  transition: .3s ease;
}

.search-input::placeholder {
  color: #9e9ea7;
}

.search-input:focus,
.search-input:hover {
  outline: none;
  border-color: rgba(0, 48, 73, 0.4);
  background-color: #fff;
  box-shadow: 0 0 0 4px rgb(0 48 73 / 10%);
}

.filter-btn {
  padding: 0 16px;
  height: 38px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 14px;
}

.table-wrapper {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 16px;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
}

.order-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.order-table td {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}

.order-row:nth-child(even) {
  background: var(--row-alt);
}

.cell-mono {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
}

.cell-price {
  font-weight: 600;
}

.cell-items {
  font-size: 12px;
  color: var(--text-muted);
  max-width: 220px;
}

.item-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.item-row:last-child {
  margin-bottom: 0;
}

.item-specs-tag {
  font-size: 11px;
  color: #EE7B5F;
  background: rgba(238, 123, 95, 0.1);
  padding: 1px 6px;
  border-radius: 3px;
}

.cell-time {
  font-size: 13px;
  color: var(--text-secondary);
}

.cell-actions {
  display: flex;
  gap: 6px;
}

.pickup-code {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background-color: #EE7B5F;
  color: #FFFFFF;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.pickup-code-inline {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 12px;
  background-color: #EE7B5F;
  color: #FFFFFF;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
}

.cell-remark {
  max-width: 160px;
}

.remark-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #FDE9BE;
  color: #A66D3E;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
}

.remark-empty {
  color: var(--text-muted);
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

.action-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--white);
  transition: opacity 0.2s;
}

.action-btn:hover { opacity: 0.85; }

.btn-primary { background: var(--primary); }
.btn-success { background: var(--success); }
.btn-danger { background: var(--danger); }
.btn-info { background: var(--info); }

.loading-cell, .empty-cell {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-info {
  font-size: 12px;
  color: var(--text-secondary);
}

.page-btns {
  display: flex;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.page-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--white);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  width: 480px;
  background: var(--card);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg);
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.detail-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.detail-items {
  padding: 12px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.detail-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item-name {
  font-weight: 500;
}

.detail-item-specs {
  font-size: 12px;
  color: #EE7B5F;
  background: rgba(238, 123, 95, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.detail-total {
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 2px solid var(--border);
  font-size: 16px;
  font-weight: 600;
}

.total-price {
  color: var(--danger);
}
</style>
