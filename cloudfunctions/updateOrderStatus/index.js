const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { orderId, status } = event

  if (!orderId || !status) {
    return {
      success: false,
      errMsg: '缺少必要参数'
    }
  }

  const validStatus = ['making', 'completed', 'canceled', 'pickup']
  if (!validStatus.includes(status)) {
    return {
      success: false,
      errMsg: '无效的订单状态'
    }
  }

  try {
    if (status === 'completed') {
      var orderRes = await db.collection('orders').doc(orderId).get()
      var order = orderRes.data
      if (order && order.items && order.items.length > 0) {
        for (var i = 0; i < order.items.length; i++) {
          var item = order.items[i]
          if (item.id) {
            try {
              await db.collection('goods').doc(item.id).update({
                data: {
                  sales: _.inc(item.quantity || 1)
                }
              })
            } catch (e) {
              console.error('更新商品销量失败:', item.id, e)
            }
          }
        }
      }
    }

    await db.collection('orders').doc(orderId).update({
      data: {
        status,
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '订单状态更新成功'
    }
  } catch (err) {
    console.error('更新订单状态失败:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
