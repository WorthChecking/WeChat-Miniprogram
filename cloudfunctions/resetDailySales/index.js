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
  const isTimerTrigger = event.TriggerName || event.TriggerSource || event.MessageType === 'timer'

  if (!isTimerTrigger) {
    var auth = await verifyAdminToken(event.token)
    if (!auth.valid) {
      return { success: false, unauthorized: true, errMsg: auth.errMsg }
    }
  }

  try {
    var res = await db.collection('goods').limit(100).get()
    var docs = res.data || []
    for (var i = 0; i < docs.length; i++) {
      await db.collection('goods').doc(docs[i]._id).update({
        data: {
          sales: 0
        }
      })
    }
    return { success: true, resetCount: docs.length }
  } catch (e) {
    console.error('重置销量失败:', e)
    return { success: false, errMsg: e.message }
  }
}
