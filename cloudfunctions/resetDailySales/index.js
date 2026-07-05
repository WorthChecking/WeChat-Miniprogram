const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
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
