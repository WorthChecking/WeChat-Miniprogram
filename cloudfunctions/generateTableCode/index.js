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
  const { tableNo, token } = event

  var auth = await verifyAdminToken(token)
  if (!auth.valid) {
    return { success: false, unauthorized: true, errMsg: auth.errMsg }
  }

  if (!tableNo) {
    return {
      success: false,
      errMsg: '缺少桌号参数'
    }
  }

  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: 'table=' + tableNo,
      page: 'pages/index/index',
      width: 430,
      autoColor: false,
      lineColor: {
        r: 0,
        g: 0,
        b: 0
      },
      isHyaline: false
    })

    const uploadResult = await cloud.uploadFile({
      cloudPath: 'tableCodes/table_' + tableNo + '_' + Date.now() + '.png',
      fileContent: result.buffer
    })

    try {
      await db.collection('tableCodes').add({
        data: {
          tableNo: tableNo,
          fileID: uploadResult.fileID,
          createTime: db.serverDate()
        }
      })
    } catch (e) {
      console.error('记录桌码失败:', e)
    }

    return {
      success: true,
      fileID: uploadResult.fileID,
      tableNo,
      tempFileURL: uploadResult.fileID
    }
  } catch (err) {
    console.error('生成桌码失败:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
