<template>
  <div class="coupons-page">
    <div class="page-header">
      <h1 class="page-title">优惠券管理</h1>
      <div class="header-actions">
        <button class="add-btn" @click="openAddModal">+ 新增优惠券</button>
      </div>
    </div>

    <div class="coupon-list" v-if="coupons.length > 0">
      <div v-for="coupon in coupons" :key="coupon._id" class="coupon-card" :class="{ expired: coupon.status === 'expired' }">
        <div class="coupon-left">
          <div class="coupon-amount">
            <span class="amount-num">{{ coupon.amount }}</span>
            <span class="amount-unit">元</span>
          </div>
          <div class="coupon-period">{{ formatDate(coupon.startDate) }} ~ {{ formatDate(coupon.endDate) }}</div>
        </div>
        <div class="coupon-right">
          <div class="coupon-scope">{{ getScopeLabel(coupon.scope) }}</div>
          <div class="coupon-actions">
            <button class="action-btn edit-btn" @click="openEditModal(coupon)">编辑</button>
            <button class="action-btn grant-btn" @click="openGrantModal(coupon)">发放</button>
            <button class="action-btn del-btn" @click="handleDelete(coupon)">删除</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">暂无优惠券，点击右上角新增</div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑优惠券' : '新增优惠券' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">面额（元）</label>
            <input v-model.number="form.amount" class="form-input" type="number" placeholder="请输入优惠券面额" />
          </div>
          <div class="form-group">
            <label class="form-label">适用范围</label>
            <div class="scope-options">
              <label class="scope-option">
                <input type="radio" v-model="form.scopeType" value="all" />
                <span>全部商品</span>
              </label>
              <label class="scope-option">
                <input type="radio" v-model="form.scopeType" value="couponGoods" />
                <span>优惠商品</span>
              </label>
              <label class="scope-option">
                <input type="radio" v-model="form.scopeType" value="category" />
                <span>按分类</span>
              </label>
            </div>
            <div v-if="form.scopeType === 'category'" class="category-checkboxes">
              <label v-for="cat in categories" :key="cat._id" class="category-checkbox">
                <input type="checkbox" :value="cat._id" v-model="form.categoryIds" />
                <span>{{ cat.name }}</span>
              </label>
              <div v-if="categories.length === 0" class="empty-cat">暂无分类，请先在商品管理中创建分类</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">有效期</label>
            <div class="date-row">
              <input v-model="form.startDate" class="form-input date-input" type="date" />
              <span class="date-sep">至</span>
              <input v-model="form.endDate" class="form-input date-input" type="date" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="submit-btn" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showGrantModal" class="modal-overlay" @click.self="showGrantModal = false">
      <div class="modal-card grant-modal">
        <div class="modal-header">
          <h3>发放优惠券</h3>
          <button class="modal-close" @click="showGrantModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">当前优惠券</label>
            <div class="grant-coupon-info">
              <span class="grant-amount">{{ grantCoupon.amount }}元</span>
              <span class="grant-scope">{{ getScopeLabel(grantCoupon.scope) }}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">发放方式</label>
            <div class="grant-type-row">
              <button class="grant-type-btn" :class="{ active: grantType === 'all' }" @click="grantType = 'all'">全量发放</button>
              <button class="grant-type-btn" :class="{ active: grantType === 'specific' }" @click="grantType = 'specific'">指定用户</button>
            </div>
          </div>
          <div class="form-group" v-if="grantType === 'specific'">
            <label class="form-label">用户OpenID</label>
            <input v-model="grantOpenid" class="form-input" placeholder="请输入用户OpenID" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showGrantModal = false">取消</button>
          <button class="submit-btn" @click="handleGrant" :disabled="granting">
            {{ granting ? '发放中...' : '确认发放' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, getCategories, callFunction } from '@/api/cloud'

const coupons = ref([])
const categories = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref(null)
const showGrantModal = ref(false)
const grantCoupon = ref({})
const grantType = ref('all')
const grantOpenid = ref('')
const granting = ref(false)

const form = ref({
  amount: '',
  scopeType: 'all',
  categoryIds: [],
  startDate: '',
  endDate: ''
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  var d = new Date(dateStr)
  var y = d.getFullYear()
  var m = (d.getMonth() + 1).toString().padStart(2, '0')
  var day = d.getDate().toString().padStart(2, '0')
  return y + '.' + m + '.' + day
}

function getScopeLabel(scope) {
  if (!scope) return '全部商品'
  if (scope.type === 'all') return '全部商品'
  if (scope.type === 'couponGoods') return '优惠商品'
  if (scope.type === 'category') {
    var ids = scope.categoryIds || []
    if (ids.length === 0) return '按分类（未选择）'
    var names = ids.map(function(id) {
      var cat = categories.value.find(function(c) { return c._id === id })
      return cat ? cat.name : id
    })
    return '按分类：' + names.join('、')
  }
  return '全部商品'
}

async function loadCoupons() {
  try {
    coupons.value = await getCoupons()
  } catch {
    coupons.value = []
  }
}

async function loadCategories() {
  try {
    categories.value = await getCategories()
  } catch {
    categories.value = []
  }
}

function openAddModal() {
  isEdit.value = false
  editingId.value = null
  form.value = { amount: '', scopeType: 'all', categoryIds: [], startDate: '', endDate: '' }
  showModal.value = true
}

function openEditModal(coupon) {
  isEdit.value = true
  editingId.value = coupon._id
  var scope = coupon.scope || { type: 'all', categoryIds: [] }
  form.value = {
    amount: coupon.amount,
    scopeType: scope.type || 'all',
    categoryIds: scope.categoryIds || [],
    startDate: coupon.startDate || '',
    endDate: coupon.endDate || ''
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSubmit() {
  if (!form.value.amount || !form.value.startDate || !form.value.endDate) {
    alert('请填写面额和有效期')
    return
  }
  if (form.value.scopeType === 'category' && form.value.categoryIds.length === 0) {
    alert('请至少选择一个分类')
    return
  }
  submitting.value = true
  try {
    var scope = {
      type: form.value.scopeType,
      categoryIds: form.value.scopeType === 'category' ? form.value.categoryIds : []
    }
    var data = {
      amount: form.value.amount,
      scope: scope,
      startDate: form.value.startDate,
      endDate: form.value.endDate
    }
    if (isEdit.value) {
      await updateCoupon(editingId.value, data)
    } else {
      await createCoupon(data)
    }
    closeModal()
    await loadCoupons()
  } catch {
    alert('操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(coupon) {
  if (!window.confirm('确认删除该优惠券？')) return
  try {
    await deleteCoupon(coupon._id)
    await loadCoupons()
  } catch {
    alert('删除失败')
  }
}

function openGrantModal(coupon) {
  grantCoupon.value = coupon
  grantType.value = 'all'
  grantOpenid.value = ''
  showGrantModal.value = true
}

async function handleGrant() {
  if (grantType.value === 'specific' && !grantOpenid.value.trim()) {
    alert('请输入用户OpenID')
    return
  }
  granting.value = true
  try {
    var data = { action: 'grantCoupon', couponId: grantCoupon.value._id }
    if (grantType.value === 'specific') {
      data.openid = grantOpenid.value.trim()
    }
    var res = await callFunction('couponManager', data)
    if (res.success) {
      alert('发放成功')
      showGrantModal.value = false
    } else {
      alert(res.errMsg || '发放失败')
    }
  } catch {
    alert('发放失败')
  } finally {
    granting.value = false
  }
}

onMounted(() => {
  loadCoupons()
  loadCategories()
})
</script>

<style scoped>
.coupons-page {
  padding: 32px;
  max-width: 900px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.add-btn {
  padding: 10px 24px;
  background: #2D5678;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.add-btn:hover { background: #234766; }

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.coupon-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.coupon-card.expired { opacity: 0.5; }

.coupon-left {
  width: 160px;
  background: linear-gradient(135deg, #2D5678, #4A7BA7);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  flex-shrink: 0;
}

.coupon-amount {
  display: flex;
  align-items: baseline;
}

.amount-num {
  font-size: 36px;
  font-weight: 700;
}

.amount-unit {
  font-size: 16px;
  margin-left: 4px;
}

.coupon-period {
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.8;
}

.coupon-right {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.coupon-scope {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.coupon-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.edit-btn { background: #e8f0fe; color: #2D5678; }
.edit-btn:hover { background: #d0e2f8; }

.grant-btn { background: #e8f5e9; color: #2e7d32; }
.grant-btn:hover { background: #c8e6c9; }

.del-btn { background: #fce4ec; color: #c62828; }
.del-btn:hover { background: #f8bbd0; }

.empty-state {
  text-align: center;
  color: #999;
  padding: 60px 0;
  font-size: 15px;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  width: 520px;
  max-height: 80vh;
  overflow-y: auto;
}

.grant-modal { width: 480px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 { margin: 0; font-size: 18px; }

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
}

.modal-body { padding: 24px; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.form-group { margin-bottom: 20px; }

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.scope-options {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.scope-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.scope-option input[type="radio"] {
  accent-color: #2D5678;
}

.category-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.category-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.category-checkbox input[type="checkbox"] {
  accent-color: #2D5678;
}

.empty-cat {
  font-size: 13px;
  color: #999;
  padding: 8px 0;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-input { flex: 1; }

.date-sep { color: #999; font-size: 14px; }

.cancel-btn {
  padding: 10px 24px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn {
  padding: 10px 24px;
  background: #2D5678;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.grant-coupon-info {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #f5f8fb;
  border-radius: 8px;
}

.grant-amount {
  font-size: 18px;
  font-weight: 600;
  color: #2D5678;
}

.grant-scope { font-size: 13px; color: #666; }

.grant-type-row {
  display: flex;
  gap: 8px;
}

.grant-type-btn {
  padding: 8px 20px;
  background: #f0f0f0;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.grant-type-btn.active {
  background: #e8f0fe;
  border-color: #2D5678;
  color: #2D5678;
}
</style>