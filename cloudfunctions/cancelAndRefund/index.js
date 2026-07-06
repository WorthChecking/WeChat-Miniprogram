const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

async function verifyAdminToken(token) {
  if (!token) return { valid: false, errMsg: '未登录' }
  try {
    var res = await db.collection('adminSessions')
      .where({ token: token })
      .limit(1)
      .get()
    if (!res.data || res.data.length === 0) {
      return { valid: false, errMsg: '登录已失效，请重新登录' }
    }
    var session = res.data[0]
    var expTime = session.expireTime
    if (typeof expTime === 'string') expTime = new Date(expTime)
    if (expTime && Date.now() > new Date(expTime).getTime()) {
      return { valid: false, errMsg: '登录已过期，请重新登录' }
    }
    return { valid: true, username: session.username }
  } catch (e) {
    return { valid: false, errMsg: '鉴权异常' }
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId, reason, token } = event

  if (!orderId) {
    return {
      success: false,
      errMsg: '缺少订单ID'
    }
  }

  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    const order = orderRes.data

    if (!order) {
      return {
        success: false,
        errMsg: '订单不存在'
      }
    }

    var isAdmin = false
    if (token) {
      var adminAuth = await verifyAdminToken(token)
      isAdmin = adminAuth.valid
    }

    if (!isAdmin) {
      const openid = wxContext.OPENID
      if (!openid || order.openid !== openid) {
        return {
          success: false,
          unauthorized: true,
          errMsg: '无权操作此订单'
        }
      }
    }

    if (order.status === 'completed') {
      return {
        success: false,
        errMsg: '订单已完成，无法取消'
      }
    }

    if (order.status === 'canceled') {
      return {
        success: false,
        errMsg: '订单已取消'
      }
    }

    if (!isAdmin) {
      const now = Date.now()
      const createTime = new Date(order.createTime).getTime()
      const timeDiff = (now - createTime) / 1000

      if (order.type === 'pickup' && timeDiff > 60) {
        return {
          success: false,
          errMsg: '自提订单超过60秒，无法自行取消，请联系商家'
        }
      }
    }

    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'canceled',
        cancelReason: reason || (isAdmin ? '管理员取消' : '用户取消'),
        cancelTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '订单已取消',
      refundAmount: order.totalPrice
    }
  } catch (err) {
    console.error('取消订单失败:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
