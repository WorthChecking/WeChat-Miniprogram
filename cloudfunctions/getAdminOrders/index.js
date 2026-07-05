const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { status, page = 1, pageSize = 20 } = event

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
