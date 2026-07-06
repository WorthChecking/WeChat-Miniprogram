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
  const { status, page = 1, pageSize = 20, token } = event

  var auth = await verifyAdminToken(token)
  if (!auth.valid) {
    return { success: false, unauthorized: true, errMsg: auth.errMsg }
  }

  try {
    let query = db.collection('orders')

    if (status) {
      query = query.where({
        status: status
      })
    }

    const countResult = await query.count()
    const total = countResult.total

    const skip = (page - 1) * pageSize
    const ordersRes = await query
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: ordersRes.data,
      total,
      page,
      pageSize
    }
  } catch (err) {
    console.error('获取订单列表失败:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
