const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { orderId } = event;
  
  try {
    const orderRes = await db.collection('orders').doc(orderId).get();
    const order = orderRes.data;
    
    if (!order) {
      return {
        success: false,
        errMsg: '订单不存在'
      };
    }
    
    if (order.status !== 'pending') {
      return {
        success: false,
        errMsg: '订单状态异常'
      };
    }
    
    const payment = cloud.cloudPay.unifiedOrder({
      body: '美味小厨-订单支付',
      outTradeNo: order.orderNo,
      spbillCreateIp: '127.0.0.1',
      totalFee: Math.round(order.totalPrice * 100),
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'payCallback',
      nonceStr: generateNonceStr(),
      tradeType: 'JSAPI',
      attach: JSON.stringify({
        orderId: orderId
      })
    });
    
    return {
      success: true,
      payment: payment
    };
  } catch (err) {
    console.error('创建支付失败', err);
    return {
      success: false,
      errMsg: err.message || '创建支付失败'
    };
  }
};

function generateNonceStr() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
