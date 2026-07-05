<template>
  <div class="goods-page">
    <div class="page-header">
      <h1 class="page-title">商品管理</h1>
      <div class="header-actions">
        <template v-if="couponGoodsMode">
          <button class="coupon-save-btn" @click="handleSaveCouponGoods" :disabled="couponSaving">{{ couponSaving ? '保存中...' : '保存' }}</button>
          <button class="batch-cancel-btn" @click="exitCouponGoodsMode">取消</button>
        </template>
        <template v-else-if="batchMode">
          <button class="batch-del-btn" @click="handleBatchDelete" :disabled="selectedIds.length === 0">删除</button>
          <button class="batch-cancel-btn" @click="exitBatchMode">取消</button>
        </template>
        <template v-else>
          <button class="cat-btn" @click="enterBatchMode">编辑</button>
          <button class="cat-btn" @click="enterCouponGoodsMode">优惠商品</button>
          <button class="cat-btn" @click="showCatModal = true">分类管理</button>
          <button class="add-btn" @click="openAddModal">+ 新增商品</button>
        </template>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input v-model="keyword" class="search-input" placeholder="搜索商品名称..." />
      </div>
    </div>

    <div class="goods-grid">
      <div v-if="filteredGoods.length === 0" class="empty-state">暂无商品</div>
      <div v-for="goods in filteredGoods" :key="goods._id" class="goods-card" :class="{ 'goods-card-selected': batchMode && selectedIds.includes(goods._id), 'goods-card-coupon': couponGoodsMode && couponGoodsIds.includes(goods._id) }" @click="onCardClick(goods._id)">
        <div v-if="batchMode" class="checkbox-wrap">
          <span class="checkbox" :class="{ checked: selectedIds.includes(goods._id) }"></span>
        </div>
        <div v-if="couponGoodsMode" class="checkbox-wrap">
          <span class="checkbox" :class="{ checked: couponGoodsIds.includes(goods._id) }"></span>
        </div>
        <div class="goods-img">
          <img v-if="goods.image" :src="goods._tempImageUrl || goods.image" alt="" />
          <span v-else class="img-placeholder">暂无图片</span>
          <span class="status-badge" :class="goods.status === 'active' ? 'badge-active' : 'badge-inactive'">
            {{ goods.status === 'active' ? '在售' : '已下架' }}
          </span>
          <span v-if="goods.isRecommend" class="recommend-badge">推荐</span>
        </div>
        <div class="goods-info">
          <h4 class="goods-name">{{ goods.name }}</h4>
          <span class="goods-sales">月售 {{ goods.sales || 0 }} 单</span>
          <div class="goods-price">¥{{ goods.price }}</div>
          <div class="goods-actions" v-if="!batchMode && !couponGoodsMode">
            <button class="edit-btn" @click="openEditModal(goods)">编辑</button>
            <button
              class="toggle-btn"
              :class="goods.status === 'active' ? 'btn-off' : 'btn-on'"
              @click="toggleStatus(goods)"
            >
              {{ goods.status === 'active' ? '下架' : '上架' }}
            </button>
            <button class="del-btn" @click="handleDelete(goods)">删除</button>
          </div>
          <div class="recommend-row" v-if="!batchMode && !couponGoodsMode">
            <span class="recommend-label">今日推荐</span>
            <button
              class="recommend-toggle"
              :class="goods.isRecommend ? 'rec-on' : 'rec-off'"
              @click="handleToggleRecommend(goods)"
            >
              {{ goods.isRecommend ? '已推荐' : '未推荐' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑商品' : '新增商品' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">商品名称</label>
            <input v-model="form.name" class="form-input" placeholder="请输入商品名称" />
          </div>
          <div class="form-group">
            <label class="form-label">商品价格（元）</label>
            <input v-model.number="form.price" class="form-input" type="number" placeholder="请输入价格" />
          </div>
          <div class="form-group">
            <label class="form-label">商品描述</label>
            <textarea v-model="form.description" class="form-textarea" placeholder="请输入描述" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">商品分类</label>
            <select v-model="form.categoryId" class="form-select">
              <option value="">请选择分类</option>
              <option v-for="cat in categories" :key="cat._id" :value="cat._id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">商品图片</label>
            <div class="image-upload-area" @click="triggerImageUpload">
              <img v-if="form.image || imagePreview" :src="imagePreview || form.image" class="upload-preview" alt="" />
              <template v-else>
                <span class="upload-icon">+</span>
                <span class="upload-text">点击上传图片</span>
              </template>
            </div>
            <input ref="imageInputRef" type="file" accept="image/*" style="display:none" @change="handleImageSelect" />
          </div>
          <div class="form-group">
            <label class="form-label">排序权重</label>
            <input v-model.number="form.sort" class="form-input" type="number" placeholder="数字越小越靠前" />
          </div>
          <div class="form-group">
            <label class="form-label">商品类型</label>
            <div class="spec-toggle">
              <span :class="!form.needSpec ? 'toggle-active' : ''" @click="form.needSpec = false">普通商品</span>
              <span :class="form.needSpec ? 'toggle-active' : ''" @click="form.needSpec = true">选规格商品</span>
            </div>
          </div>
          <div class="form-group" v-if="form.needSpec">
            <label class="form-label">规格设置</label>
            <div class="spec-groups-editor">
              <div v-for="(group, gIdx) in form.specGroups" :key="gIdx" class="spec-group-item">
                <div class="spec-group-header">
                  <input v-model="group.name" class="spec-group-name" placeholder="规格名称（如：份量）" />
                  <button class="remove-spec-group" @click="form.specGroups.splice(gIdx, 1)">✕</button>
                </div>
                <input v-model="group.optionsStr" class="spec-options-input" placeholder="选项（用逗号分隔，如：小份,中份,大份）" @blur="parseOptions(group)" />
              </div>
              <button class="add-spec-group-btn" @click="addSpecGroup">+ 添加规格</button>
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

    <div v-if="showCatModal" class="modal-overlay" @click.self="showCatModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>分类管理</h3>
          <div class="cat-modal-actions">
            <button v-if="!catEditMode" class="cat-edit-sort-btn" @click="enterCatEdit">编辑排序</button>
            <template v-else>
              <button class="cat-save-btn" @click="handleSaveCatSort" :disabled="catSaving">{{ catSaving ? '保存中...' : '保存' }}</button>
              <button class="cat-cancel-btn" @click="exitCatEdit">取消</button>
            </template>
            <button class="modal-close" @click="showCatModal = false">✕</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="cat-add-row">
            <input v-model="newCatName" class="form-input" placeholder="输入新分类名称" />
            <button class="cat-add-btn" @click="handleAddCategory">添加</button>
          </div>
          <div class="cat-list">
            <div v-for="(cat, index) in categories" :key="cat._id" class="cat-item" :class="{ 'cat-item-editing': catEditMode }">
              <span class="cat-name">{{ cat.name }}</span>
              <span v-if="!catEditMode" class="cat-sort">排序: {{ cat.sort }}</span>
              <template v-else>
                <span class="cat-sort-edit">
                  <button class="sort-arrow-btn" @click="moveCategoryUp(index)" :disabled="index === 0">↑</button>
                  <span class="sort-num">{{ index + 1 }}</span>
                  <button class="sort-arrow-btn" @click="moveCategoryDown(index)" :disabled="index === categories.length - 1">↓</button>
                </span>
              </template>
              <button class="cat-del-btn" @click="handleDeleteCategory(cat)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getGoods, getCategories, updateGoodsStatus, toggleGoodsRecommend, updateGoods, addGoods, deleteGoods, addCategory, deleteCategory, updateCategory, callFunction, initCloud, loginWithWechat } from '@/api/cloud'

const goods = ref([])
const categories = ref([])
const keyword = ref('')
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref(null)
const showCatModal = ref(false)
const newCatName = ref('')
const batchMode = ref(false)
const selectedIds = ref([])
const catEditMode = ref(false)
const catSaving = ref(false)
const imageInputRef = ref(null)
const imagePreview = ref('')
const imageFile = ref(null)
const couponGoodsMode = ref(false)
const couponGoodsIds = ref([])
const couponSaving = ref(false)

const form = ref({
  name: '',
  price: '',
  description: '',
  categoryId: '',
  image: '',
  sort: 0,
  needSpec: false,
  specGroups: []
})

const filteredGoods = computed(() => {
  var list = goods.value
  if (keyword.value) {
    var kw = keyword.value.toLowerCase()
    list = list.filter(function(g) { return g.name.toLowerCase().includes(kw) })
  }
  return list.slice().sort(function(a, b) {
    if (a.isRecommend && !b.isRecommend) return -1
    if (!a.isRecommend && b.isRecommend) return 1
    return 0
  })
})

async function loadGoods() {
  try {
    var list = await getGoods()
    await resolveImageUrls(list)
    goods.value = list
  } catch {
    goods.value = []
  }
}

async function resolveImageUrls(list) {
  var cloudIds = []
  var idIndexMap = {}
  for (var i = 0; i < list.length; i++) {
    if (list[i].image && list[i].image.indexOf('cloud://') === 0) {
      cloudIds.push(list[i].image)
      idIndexMap[cloudIds.length - 1] = i
    }
  }
  if (cloudIds.length === 0) return
  try {
    await loginWithWechat()
    var app = initCloud()
    var res = await app.getTempFileURL({ fileList: cloudIds })
    if (res.fileList) {
      for (var j = 0; j < res.fileList.length; j++) {
        var item = res.fileList[j]
        if ((item.code === 'SUCCESS' || item.status === 0) && item.tempFileURL) {
          var idx = idIndexMap[j]
          if (idx !== undefined && list[idx]) {
            list[idx]._tempImageUrl = item.tempFileURL
          }
        }
      }
    }
  } catch (e) {
    console.warn('图片链接转换失败:', e)
  }
}

async function loadCategories() {
  try {
    categories.value = await getCategories()
  } catch {
    categories.value = []
  }
}

async function toggleStatus(goodsItem) {
  const newStatus = goodsItem.status === 'active' ? 'inactive' : 'active'
  const label = newStatus === 'active' ? '上架' : '下架'
  if (!window.confirm('确认' + label + '「' + goodsItem.name + '」？')) return
  try {
    await updateGoodsStatus(goodsItem._id, newStatus)
    goodsItem.status = newStatus
  } catch {
    alert('操作失败')
  }
}

async function handleToggleRecommend(goodsItem) {
  var newVal = !goodsItem.isRecommend
  if (newVal) {
    var currentCount = goods.value.filter(function(g) { return g.isRecommend }).length
    if (currentCount >= 4) {
      alert('已达最大推荐量（最多4个）')
      return
    }
  }
  try {
    await toggleGoodsRecommend(goodsItem._id, newVal)
    goodsItem.isRecommend = newVal
  } catch {
    alert('操作失败')
  }
}

async function handleDelete(goodsItem) {
  if (!window.confirm('确认删除「' + goodsItem.name + '」？')) return
  try {
    await deleteGoods(goodsItem._id)
    await loadGoods()
  } catch {
    alert('删除失败')
  }
}

function openAddModal() {
  isEdit.value = false
  editingId.value = null
  form.value = { name: '', price: '', description: '', categoryId: '', image: '', sort: 0, needSpec: false, specGroups: [] }
  imagePreview.value = ''
  imageFile.value = null
  showModal.value = true
}

function triggerImageUpload() {
  if (imageInputRef.value) {
    imageInputRef.value.click()
  }
}

function handleImageSelect(e) {
  var file = e.target.files && e.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }
  imageFile.value = file
  var reader = new FileReader()
  reader.onload = function(ev) {
    imagePreview.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

function fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader()
    reader.onload = function() {
      var result = reader.result
      if (result && typeof result === 'string') {
        var base64 = result.split(',')[1]
        resolve(base64)
      } else {
        reject(new Error('文件读取失败'))
      }
    }
    reader.onerror = function() { reject(new Error('文件读取错误')) }
    reader.readAsDataURL(file)
  })
}

function openEditModal(goodsItem) {
  isEdit.value = true
  editingId.value = goodsItem._id
  var specGroups = []
  if (goodsItem.specGroups && goodsItem.specGroups.length > 0) {
    specGroups = goodsItem.specGroups.map(function(g) {
      return { name: g.name, options: g.options || [], optionsStr: (g.options || []).join(',') }
    })
  }
  form.value = {
    name: goodsItem.name,
    price: goodsItem.price,
    description: goodsItem.description || '',
    categoryId: goodsItem.categoryId || '',
    image: goodsItem.image || '',
    sort: goodsItem.sort || 0,
    needSpec: goodsItem.needSpec || false,
    specGroups: specGroups
  }
  imagePreview.value = ''
  imageFile.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  imagePreview.value = ''
  imageFile.value = null
}

async function handleSubmit() {
  if (!form.value.name || !form.value.price) {
    alert('请填写商品名称和价格')
    return
  }
  submitting.value = true
  try {
    var data = { ...form.value }
    if (data.needSpec && data.specGroups) {
      data.specGroups = data.specGroups.map(function(g) {
        return { name: g.name, options: g.options || [] }
      })
    }
    if (imageFile.value) {
      var base64Data = await fileToBase64(imageFile.value)
      var uploadRes = await callFunction('loginAdmin', {
        action: 'uploadImage',
        imageData: base64Data,
        fileName: imageFile.value.name
      })
      if (!uploadRes.success) {
        throw new Error(uploadRes.errMsg || '图片上传失败')
      }
      data.image = uploadRes.fileID
    }
    if (isEdit.value) {
      await updateGoods(editingId.value, data)
    } else {
      data.status = 'active'
      await addGoods(data)
    }
    closeModal()
    await loadGoods()
  } catch {
    alert('操作失败')
  } finally {
    submitting.value = false
  }
}

function addSpecGroup() {
  form.value.specGroups.push({ name: '', options: [], optionsStr: '' })
}

function parseOptions(group) {
  if (group.optionsStr) {
    group.options = group.optionsStr.split(/[,，]/).map(function(s) { return s.trim() }).filter(function(s) { return s })
  } else {
    group.options = []
  }
}

async function handleAddCategory() {
  if (!newCatName.value.trim()) {
    alert('请输入分类名称')
    return
  }
  try {
    const maxSort = categories.value.length > 0 ? Math.max(...categories.value.map(c => c.sort)) : 0
    await addCategory({
      name: newCatName.value.trim(),
      sort: maxSort + 1
    })
    newCatName.value = ''
    await loadCategories()
  } catch {
    alert('添加失败')
  }
}

async function handleDeleteCategory(cat) {
  if (!window.confirm('确认删除分类「' + cat.name + '」？')) return
  try {
    await deleteCategory(cat._id)
    await loadCategories()
  } catch {
    alert('删除失败')
  }
}

function enterCatEdit() {
  catEditMode.value = true
}

function exitCatEdit() {
  catEditMode.value = false
  loadCategories()
}

function moveCategoryUp(index) {
  if (index <= 0) return
  var list = categories.value
  var temp = list[index]
  list.splice(index, 1)
  list.splice(index - 1, 0, temp)
}

function moveCategoryDown(index) {
  var list = categories.value
  if (index >= list.length - 1) return
  var temp = list[index]
  list.splice(index, 1)
  list.splice(index + 1, 0, temp)
}

async function handleSaveCatSort() {
  catSaving.value = true
  try {
    for (var i = 0; i < categories.value.length; i++) {
      var cat = categories.value[i]
      var res = await updateCategory(cat._id, { sort: i + 1 })
      if (!res.success) {
        throw new Error('更新「' + cat.name + '」失败: ' + (res.errMsg || '未知错误'))
      }
      cat.sort = i + 1
    }
    catEditMode.value = false
  } catch (err) {
    alert(err.message || '保存排序失败')
  } finally {
    catSaving.value = false
  }
}

function enterBatchMode() {
  batchMode.value = true
  selectedIds.value = []
}

function exitBatchMode() {
  batchMode.value = false
  selectedIds.value = []
}

function onCardClick(id) {
  if (batchMode.value) {
    toggleSelect(id)
  } else if (couponGoodsMode.value) {
    toggleCouponGoods(id)
  }
}

function toggleSelect(id) {
  var idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function enterCouponGoodsMode() {
  couponGoodsMode.value = true
  couponGoodsIds.value = goods.value.filter(function(g) { return g.isCouponGoods }).map(function(g) { return g._id })
}

function exitCouponGoodsMode() {
  couponGoodsMode.value = false
  couponGoodsIds.value = []
}

function toggleCouponGoods(id) {
  var idx = couponGoodsIds.value.indexOf(id)
  if (idx > -1) {
    couponGoodsIds.value.splice(idx, 1)
  } else {
    couponGoodsIds.value.push(id)
  }
}

async function handleSaveCouponGoods() {
  couponSaving.value = true
  try {
    for (var i = 0; i < goods.value.length; i++) {
      var g = goods.value[i]
      var shouldBe = couponGoodsIds.value.indexOf(g._id) > -1
      if (g.isCouponGoods !== shouldBe) {
        await updateGoods(g._id, { isCouponGoods: shouldBe })
        g.isCouponGoods = shouldBe
      }
    }
    exitCouponGoodsMode()
  } catch {
    alert('保存失败')
  } finally {
    couponSaving.value = false
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  if (!window.confirm('确认删除选中的 ' + selectedIds.value.length + ' 个商品？')) return
  try {
    for (var i = 0; i < selectedIds.value.length; i++) {
      await deleteGoods(selectedIds.value[i])
    }
    exitBatchMode()
    await loadGoods()
  } catch {
    alert('删除失败')
  }
}

onMounted(() => {
  loadGoods()
  loadCategories()
})

watch(showCatModal, function(val) {
  if (val) {
    catEditMode.value = false
    loadCategories()
  }
})
</script>

<style scoped>
.goods-page {
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

.add-btn, .cat-btn {
  padding: 8px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.add-btn {
  background: var(--primary);
  color: var(--white);
}

.add-btn:hover { background: var(--primary-dark); }

.cat-btn {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.cat-btn:hover { border-color: var(--primary); color: var(--primary); }

.toolbar {
  margin-bottom: 20px;
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

.search-input::placeholder { color: #9e9ea7; }

.search-input:focus,
.search-input:hover {
  outline: none;
  border-color: rgba(0, 48, 73, 0.4);
  background-color: #fff;
  box-shadow: 0 0 0 4px rgb(0 48 73 / 10%);
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}

.goods-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: default;
  transition: border-color 0.2s;
}

.goods-card-selected {
  border-color: var(--primary);
  background: #fff7ed;
}

.checkbox-wrap {
  padding: 10px 12px 0;
  display: flex;
  align-items: center;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background: var(--primary);
  border-color: var(--primary);
}

.checkbox.checked::after {
  content: '✓';
  color: var(--white);
  font-size: 12px;
  font-weight: 700;
}

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

.coupon-save-btn {
  padding: 8px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  background: #2D5678;
  color: var(--white);
  transition: opacity 0.2s;
}

.coupon-save-btn:hover { opacity: 0.85; }
.coupon-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.goods-card-coupon {
  border: 2px solid #2D5678;
  box-shadow: 0 0 12px rgba(45, 86, 120, 0.15);
}

.goods-img {
  height: 140px;
  margin: 12px;
  background: var(--bg);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.goods-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  font-size: 12px;
  color: var(--text-muted);
}

.status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--white);
}

.badge-active { background: var(--success); }
.badge-inactive { background: var(--danger); }

.recommend-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--white);
  background: #ff8c42;
}

.recommend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.recommend-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
}

.recommend-toggle {
  padding: 3px 14px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s;
}

.rec-on {
  background: #ff8c42;
  color: var(--white);
}

.rec-off {
  background: var(--bg);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.goods-info {
  padding: 0 12px 12px;
}

.goods-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.goods-sales {
  font-size: 11px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 8px;
}

.goods-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--danger);
  margin-bottom: 12px;
}

.goods-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  flex: 1;
  height: 28px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  transition: border-color 0.2s;
}

.edit-btn:hover { border-color: var(--primary); color: var(--primary); }

.toggle-btn {
  flex: 1;
  height: 28px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--white);
  transition: opacity 0.2s;
}

.toggle-btn:hover { opacity: 0.85; }

.btn-off { background: #f59e0b; }
.btn-on { background: var(--success); }

.del-btn {
  flex: 1;
  height: 28px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--white);
  background: var(--danger);
  transition: opacity 0.2s;
}

.del-btn:hover { opacity: 0.85; }

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
  width: 520px;
  max-height: 85vh;
  background: var(--card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--white);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--primary);
}

.form-textarea {
  height: auto;
  padding: 8px 12px;
  resize: vertical;
}

.image-upload-area {
  width: 160px;
  height: 160px;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
  overflow: hidden;
  background-color: var(--bg);
}

.image-upload-area:hover {
  border-color: var(--primary);
}

.upload-icon {
  font-size: 36px;
  color: var(--text-muted);
  line-height: 1;
}

.upload-text {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spec-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.spec-toggle span {
  flex: 1;
  padding: 8px 16px;
  text-align: center;
  cursor: pointer;
  background: var(--bg);
  color: var(--text-secondary);
  transition: all 0.2s;
}

.spec-toggle .toggle-active {
  background: #EE7B5F;
  color: #fff;
}

.spec-groups-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-group-item {
  padding: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.spec-group-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.spec-group-name {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 13px;
}

.remove-spec-group {
  padding: 4px 8px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.spec-options-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 13px;
}

.add-spec-group-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  cursor: pointer;
}

.add-spec-group-btn:hover {
  background: #e8e8e8;
}

.form-select {
  appearance: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.cancel-btn {
  padding: 8px 20px;
  border-radius: var(--radius);
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 14px;
}

.submit-btn {
  padding: 8px 20px;
  border-radius: var(--radius);
  background: var(--primary);
  color: var(--white);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.submit-btn:hover { background: var(--primary-dark); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.cat-add-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.cat-add-btn {
  padding: 0 20px;
  height: 38px;
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.cat-add-btn:hover { background: var(--primary-dark); }

.cat-list {
  max-height: 300px;
  overflow-y: auto;
}

.cat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg);
  border-radius: var(--radius);
  margin-bottom: 8px;
}

.cat-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.cat-sort {
  font-size: 12px;
  color: var(--text-muted);
}

.cat-del-btn {
  padding: 4px 12px;
  background: var(--danger);
  color: var(--white);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.cat-del-btn:hover { opacity: 0.85; }

.cat-modal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-edit-sort-btn {
  padding: 6px 16px;
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
}

.cat-edit-sort-btn:hover { background: var(--primary-dark); }

.cat-save-btn {
  padding: 6px 16px;
  background: var(--success);
  color: var(--white);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
}

.cat-save-btn:hover { opacity: 0.85; }
.cat-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.cat-cancel-btn {
  padding: 6px 16px;
  background: #9E9E9E;
  color: var(--white);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
}

.cat-cancel-btn:hover { opacity: 0.85; }

.cat-item-editing {
  flex-wrap: wrap;
  gap: 8px;
}

.cat-sort-edit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-arrow-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-arrow-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.sort-arrow-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sort-num {
  min-width: 24px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}
</style>
