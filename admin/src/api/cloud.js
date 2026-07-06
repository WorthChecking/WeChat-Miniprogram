import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = 'YOUR_ENV_ID'

let app = null
let db = null
let auth = null

export function initCloud() {
  if (app) return app
  app = cloudbase.init({
    env: ENV_ID
  })
  auth = app.auth({
    persistence: 'local'
  })
  db = app.database()
  return app
}

export function getDb() {
  if (!db) initCloud()
  return db
}

export function getAuth() {
  if (!auth) initCloud()
  return auth
}

const PUBLIC_ACTIONS = {
  loginAdmin: ['login', 'initAdmin', 'getStore', 'getOpenId', 'create', 'poll', 'confirm']
}

function isPublicAction(name, data) {
  if (!data || typeof data.action !== 'string') return false
  var list = PUBLIC_ACTIONS[name]
  return !!(list && list.indexOf(data.action) !== -1)
}

export async function callFunction(name, data = {}) {
  if (!app) initCloud()
  var payload = Object.assign({}, data)
  if (!isPublicAction(name, data)) {
    var token = localStorage.getItem('admin_auth_token')
    if (token) payload.token = token
  }
  try {
    const res = await app.callFunction({
      name,
      data: payload
    })
    var result = res.result
    if (result && result.unauthorized) {
      localStorage.removeItem('admin_auth_token')
      localStorage.removeItem('admin_username')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return result
  } catch (err) {
    console.error(`云函数 ${name} 调用失败:`, err)
    throw err
  }
}

export async function loginWithWechat() {
  if (!auth) initCloud()
  try {
    const loginState = await auth.getLoginState()
    if (loginState) {
      return loginState
    }
    await auth.signInAnonymously()
    return auth.getLoginState()
  } catch (err) {
    console.error('登录失败:', err)
    throw err
  }
}

export async function testConnection() {
  try {
    if (!app) initCloud()
    await loginWithWechat()
    const database = getDb()
    await database.collection('settings').doc('store_config').get()
    return { success: true, env: ENV_ID }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function logout() {
  if (!auth) initCloud()
  try {
    await callFunction('loginAdmin', { action: 'logout' })
  } catch (e) {
    console.error('注销云函数调用失败:', e)
  }
  await auth.signOut()
  localStorage.removeItem('admin_auth_token')
  localStorage.removeItem('admin_username')
}

export async function getLoginState() {
  if (!auth) initCloud()
  try {
    const loginState = await auth.getLoginState()
    return loginState
  } catch {
    return null
  }
}

export async function getStoreInfo() {
  try {
    var res = await callFunction('loginAdmin', { action: 'getStore' })
    if (res.success && res.data) {
      return res.data
    }
    return {}
  } catch (err) {
    console.error('getStoreInfo 失败:', err)
    return {}
  }
}

export async function updateStoreInfo(data) {
  try {
    var res = await callFunction('loginAdmin', { action: 'updateStore', storeData: data })
    return res
  } catch (err) {
    console.error('updateStoreInfo 失败:', err)
    return { success: false, errMsg: err.message }
  }
}

export async function getCategories() {
  const database = getDb()
  try {
    const res = await database.collection('categories').orderBy('sort', 'asc').get()
    return (res.data || []).map(function(item) {
      var d = item.data || item
      return Object.assign({ _id: item._id }, d)
    })
  } catch {
    return []
  }
}

export async function getGoods(categoryId) {
  const database = getDb()
  try {
    let query = database.collection('goods')
    if (categoryId) {
      query = query.where({ categoryId })
    }
    const res = await query.orderBy('sort', 'asc').limit(100).get()
    return res.data || []
  } catch {
    return []
  }
}

export async function updateGoodsStatus(goodsId, status) {
  try {
    var res = await callFunction('loginAdmin', {
      action: 'updateGoodsStatus',
      goodsId: goodsId,
      status: status
    })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function toggleGoodsRecommend(goodsId, isRecommend) {
  try {
    var res = await callFunction('loginAdmin', {
      action: 'toggleRecommend',
      goodsId: goodsId,
      isRecommend: isRecommend
    })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function updateGoods(goodsId, data) {
  const database = getDb()
  try {
    await database.collection('goods').doc(goodsId).update({ data: data })
    return { success: true }
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function addGoods(data) {
  const database = getDb()
  try {
    const res = await database.collection('goods').add(data)
    return { success: true, id: res.id }
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function deleteGoods(goodsId) {
  const database = getDb()
  try {
    await database.collection('goods').doc(goodsId).remove()
    return { success: true }
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function addCategory(data) {
  const database = getDb()
  try {
    const res = await database.collection('categories').add(data)
    return { success: true, id: res.id }
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function deleteCategory(categoryId) {
  const database = getDb()
  try {
    await database.collection('categories').doc(categoryId).remove()
    return { success: true }
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function updateCategory(categoryId, data) {
  try {
    var res = await callFunction('loginAdmin', {
      action: 'updateDoc',
      collection: 'categories',
      docId: categoryId,
      data: data
    })
    console.log('updateCategory 云函数结果:', categoryId, data, JSON.stringify(res))
    return res
  } catch (err) {
    console.error('updateCategory 失败:', categoryId, err)
    return { success: false, errMsg: err.message }
  }
}

export async function getOrders(status, page = 1, pageSize = 20) {
  const database = getDb()
  try {
    let query = database.collection('orders')
    if (status && status !== 'all') {
      query = query.where({ status })
    }
    const skip = (page - 1) * pageSize
    const res = await query.orderBy('createTime', 'desc').skip(skip).limit(pageSize).get()
    const countRes = await database.collection('orders').count()
    var list = (res.data || []).map(function(item) {
      var d = item.data || item
      return Object.assign({ _id: item._id }, d)
    })
    return {
      data: list,
      total: countRes.total,
      page,
      pageSize
    }
  } catch (err) {
    console.error('获取订单失败:', err)
    return { data: [], total: 0, page, pageSize }
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    const res = await callFunction('updateOrderStatus', { orderId, status })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function deleteOrder(orderId) {
  const database = getDb()
  try {
    await database.collection('orders').doc(orderId).remove()
    return { success: true }
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function cancelAndRefund(orderId) {
  try {
    const res = await callFunction('cancelAndRefund', { orderId })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export function watchOrders(callback) {
  const database = getDb()
  try {
    return database.collection('orders')
      .where({ status: database.RegExp({ regexp: 'making|pickup' }) })
      .watch({
        onChange: (snapshot) => {
          callback(snapshot)
        },
        onError: (err) => {
          console.error('订单监听错误:', err)
        }
      })
  } catch (err) {
    console.error('启动订单监听失败:', err)
    return null
  }
}

export async function createLoginCode() {
  try {
    const res = await callFunction('loginAdmin', { action: 'create' })
    return res
  } catch (err) {
    console.error('创建登录码失败:', err)
    return { success: false, errMsg: err.message }
  }
}

export async function pollLoginStatus(loginCode) {
  try {
    const res = await callFunction('loginAdmin', { action: 'poll', loginCode })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function getCoupons(status) {
  try {
    const res = await callFunction('couponManager', { action: 'getCoupons', status: status || 'all' })
    return res.data || []
  } catch (err) {
    console.error('获取优惠券失败:', err)
    return []
  }
}

export async function createCoupon(data) {
  try {
    const res = await callFunction('couponManager', { action: 'createCoupon', ...data })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function updateCoupon(couponId, data) {
  try {
    const res = await callFunction('couponManager', { action: 'updateCoupon', couponId, ...data })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function deleteCoupon(couponId) {
  try {
    const res = await callFunction('couponManager', { action: 'deleteCoupon', couponId })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}

export async function getCouponGoods(couponId) {
  try {
    const res = await callFunction('couponManager', { action: 'getCouponGoods', couponId })
    return res.data || []
  } catch (err) {
    return []
  }
}

export async function setCouponGoods(couponId, goodsIds) {
  try {
    const res = await callFunction('couponManager', { action: 'setCouponGoods', couponId, goodsIds })
    return res
  } catch (err) {
    return { success: false, errMsg: err.message }
  }
}
