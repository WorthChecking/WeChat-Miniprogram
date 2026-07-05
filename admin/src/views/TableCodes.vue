<template>
  <div class="table-codes-page">
    <div class="page-header">
      <h1 class="page-title">桌码管理</h1>
    </div>

    <div class="generate-card">
      <h3 class="section-title">生成桌码</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">桌号</label>
          <input v-model="tableNo" class="form-input" placeholder="例如：A01、B05" />
        </div>
        <button class="generate-btn" @click="handleGenerate" :disabled="generating">
          {{ generating ? '生成中...' : '生成桌码' }}
        </button>
      </div>
    </div>

    <div class="codes-card">
      <h3 class="section-title">已生成桌码</h3>
      <div v-if="tableCodes.length === 0" class="empty-state">暂无桌码，请在上方生成</div>
      <div class="codes-grid">
        <div v-for="(code, idx) in tableCodes" :key="code._id || idx" class="code-item">
          <div class="code-preview">
            <img v-if="code.imageUrl" :src="code.imageUrl" alt="" class="code-img" />
            <div v-else class="code-placeholder">
              <span>生成中...</span>
            </div>
          </div>
          <div class="code-info">
            <span class="code-table">{{ code.tableNo }}号桌</span>
            <span class="code-time">{{ formatTime(code.createTime) }}</span>
          </div>
          <div class="code-actions">
            <button class="action-btn btn-primary" @click="handleDownload(code)">下载</button>
            <button class="action-btn btn-danger" @click="handleDelete(code)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDb } from '@/api/cloud'
import QRCode from 'qrcode'

const tableNo = ref('')
const generating = ref(false)
const tableCodes = ref([])

function buildTableImage(tableNo) {
  return new Promise(function(resolve) {
    var canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 300
    var ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 240, 300)

    QRCode.toCanvas(canvas, 'table_' + tableNo, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }, function() {
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 22px -apple-system, "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(tableNo + '号桌', 120, 252)

      ctx.fillStyle = '#999999'
      ctx.font = '12px -apple-system, "Microsoft YaHei", sans-serif'
      ctx.fillText('美味小厨', 120, 278)

      resolve(canvas.toDataURL('image/png'))
    })
  })
}

async function loadTableCodes() {
  try {
    const db = getDb()
    const res = await db.collection('tableCodes').orderBy('createTime', 'desc').limit(50).get()
    var list = res.data || []
    var result = []
    for (var i = 0; i < list.length; i++) {
      var item = list[i]
      var d = item.data || item
      var obj = { _id: item._id, tableNo: d.tableNo || '', createTime: d.createTime }
      if (obj.tableNo) {
        if (d.imageUrl) {
          obj.imageUrl = d.imageUrl
        } else {
          obj.imageUrl = await buildTableImage(obj.tableNo)
        }
      }
      result.push(obj)
    }
    tableCodes.value = result
  } catch (e) {
    console.error('加载桌码异常:', e)
    tableCodes.value = []
  }
}

async function handleGenerate() {
  if (!tableNo.value.trim()) {
    alert('请输入桌号')
    return
  }

  var inputVal = tableNo.value.trim()
  var existCode = tableCodes.value.find(function(c) { return c.tableNo === inputVal })
  if (existCode) {
    alert('该桌号已存在')
    return
  }

  generating.value = true
  try {
    const db = getDb()
    await db.collection('tableCodes').add({
      data: {
        tableNo: inputVal,
        createTime: new Date()
      }
    })

    tableNo.value = ''
    await loadTableCodes()
  } catch {
    alert('生成失败，请重试')
  } finally {
    generating.value = false
  }
}

function handleDownload(code) {
  if (!code.imageUrl) {
    alert('暂无图片可下载')
    return
  }
  var link = document.createElement('a')
  link.href = code.imageUrl
  link.download = '桌码_' + code.tableNo + '.png'
  link.target = '_blank'
  link.click()
}

async function handleDelete(code) {
  if (!window.confirm('确认删除「' + code.tableNo + '号桌」的桌码？')) return
  try {
    const db = getDb()
    await db.collection('tableCodes').doc(code._id).remove()
    await loadTableCodes()
  } catch {
    alert('删除失败')
  }
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

onMounted(() => {
  loadTableCodes()
})
</script>

<style scoped>
.table-codes-page {
  max-width: 1000px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
}

.generate-card, .codes-card {
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
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.form-group {
  flex: 1;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--white);
  color: var(--text-primary);
}

.form-input:focus {
  border-color: var(--primary);
}

.generate-btn {
  padding: 0 24px;
  height: 38px;
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
}

.generate-btn:hover { background: var(--primary-dark); }
.generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  font-size: 14px;
}

.codes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.code-item {
  background: var(--bg);
  border-radius: var(--radius);
  padding: 16px;
  text-align: center;
}

.code-preview {
  width: 120px;
  height: 150px;
  margin: 0 auto 12px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.code-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.code-placeholder {
  font-size: 14px;
  color: var(--text-muted);
}

.code-info {
  margin-bottom: 8px;
}

.code-table {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.code-time {
  font-size: 11px;
  color: var(--text-muted);
}

.code-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
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
.btn-danger { background: var(--danger); }
</style>
