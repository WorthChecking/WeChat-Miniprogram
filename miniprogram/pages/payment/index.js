var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    orderId: '',
    orderNo: '',
    totalPrice: 0,
    payStatus: 'pending',
    countdown: 3
  },

  onLoad: function(options) {
    var orderId = options.orderId;
    var orderNo = options.orderNo;
    var totalPrice = options.totalPrice;
    
    this.setData({
      orderId: orderId,
      orderNo: orderNo,
      totalPrice: totalPrice
    });
    
    this.startPayment();
  },

  startPayment: function() {
    var that = this;
    
    that.setData({
      payStatus: 'paying'
    });
    
    setTimeout(function() {
      that.simulatePayment();
    }, 2000);
  },

  simulatePayment: function() {
    var that = this;
    var db = util.getDb();
    
    db.collection('orders').doc(that.data.orderId).update({
      data: {
        status: 'making',
        payStatus: 'paid',
        payTime: db.serverDate()
      }
    }).then(function() {
      that.setData({
        payStatus: 'success'
      });
      
      that.startCountdown();
    }).catch(function(err) {
      console.error('更新订单失败', err);
      that.setData({
        payStatus: 'failed'
      });
    });
  },

  startCountdown: function() {
    var that = this;
    var countdown = 3;
    
    var timer = setInterval(function() {
      countdown = countdown - 1;
      that.setData({
        countdown: countdown
      });
      
      if (countdown <= 0) {
        clearInterval(timer);
        that.goToOrderDetail();
      }
    }, 1000);
  },

  goToOrderDetail: function() {
    wx.redirectTo({
      url: '/pages/orderDetail/index?id=' + this.data.orderId
    });
  },

  onViewOrder: function() {
    this.goToOrderDetail();
  },

  onBackHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
