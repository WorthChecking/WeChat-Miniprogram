const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { tableNo } = event

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
