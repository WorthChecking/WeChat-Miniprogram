const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId, reason } = event

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

    const now = Date.now()
    const createTime = new Date(order.createTime).getTime()
    const timeDiff = (now - createTime) / 1000

    if (order.type === 'pickup' && timeDiff > 60) {
      return {
        success: false,
        errMsg: '自提订单超过60秒，无法自行取消，请联系商家'
      }
    }

    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'canceled',
        cancelReason: reason || '用户取消',
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
