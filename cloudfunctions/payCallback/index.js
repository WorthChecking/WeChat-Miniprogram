const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { resultCode, outTradeNo, attach } = event;
  
  try {
    if (resultCode === 'SUCCESS') {
      const attachData = JSON.parse(attach);
      const orderId = attachData.orderId;
      
      await db.collection('orders').doc(orderId).update({
        data: {
          status: 'preparing',
          payTime: db.serverDate(),
          payStatus: 'paid'
        }
      });
      
      return {
        errcode: 0,
        errmsg: 'success'
      };
    } else {
      return {
        errcode: -1,
        errmsg: '支付失败'
      };
    }
  } catch (err) {
    console.error('支付回调处理失败', err);
    return {
      errcode: -1,
      errmsg: err.message || '处理失败'
    };
  }
};
