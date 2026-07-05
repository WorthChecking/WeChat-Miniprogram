const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { items, totalPrice, type, tableNo, pickupTime } = event

  try {
    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
    
    const orderData = {
      orderNo,
      openid: wxContext.OPENID,
      items,
      totalPrice,
      type,
      tableNo: type === 'dine-in' ? tableNo : '',
      pickupTime: type === 'pickup' ? pickupTime : '',
      status: 'making',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const result = await db.collection('orders').add({
      data: orderData
    })

    return {
      success: true,
      orderId: result._id,
      orderNo
    }
  } catch (err) {
    console.error('创建订单失败:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
