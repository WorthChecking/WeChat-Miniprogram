var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    storeInfo: {},
    recommendGoods: [],
    orderStatus: [
      { name: '待付款', count: 0 },
      { name: '制作中', count: 0 },
      { name: '待取餐', count: 0 },
      { name: '已完成', count: 0 }
    ],
    loading: true
  },

  onLoad: function(options) {
    this.loadStoreInfo();
    this.loadRecommendGoods();
    this.loadOrderStatus();
  },

  onShow: function() {
    this.loadStoreInfo();
    this.loadOrderStatus();
    this.updateCartBadge();
  },

  onPullDownRefresh: function() {
    var that = this;
    Promise.all([
      that.loadStoreInfo(),
      that.loadRecommendGoods(),
      that.loadOrderStatus()
    ]).then(function() {
      wx.stopPullDownRefresh();
    });
  },

  loadStoreInfo: function() {
    var that = this;
    return util.getStoreInfo().then(function(res) {
      that.setData({
        storeInfo: res
      });
    });
  },

  loadRecommendGoods: function() {
    var that = this;
    return util.getRecommendGoods().then(function(res) {
      that.setData({
        recommendGoods: res,
        loading: false
      });
    });
  },

  loadOrderStatus: function() {
    var that = this;
    var db = util.getDb();
    
    var statusList = ['pending', 'making', 'pickup', 'completed'];
    var promises = statusList.map(function(status) {
      return db.collection('orders').where({
        status: status
      }).count();
    });
    
    return Promise.all(promises).then(function(results) {
      var orderStatus = that.data.orderStatus;
      orderStatus[0].count = results[0].total || 0;
      orderStatus[1].count = results[1].total || 0;
      orderStatus[2].count = results[2].total || 0;
      orderStatus[3].count = results[3].total || 0;
      that.setData({
        orderStatus: orderStatus
      });
    }).catch(function(err) {
      console.error('加载订单状态失败', err);
    });
  },

  updateCartBadge: function() {
    var count = app.getCartCount();
    if (count > 0) {
      wx.setTabBarBadge({
        index: 1,
        text: count.toString()
      });
    } else {
      wx.removeTabBarBadge({
        index: 1
      });
    }
  },

  onScanQRCode: function() {
    var that = this;
    wx.scanCode({
      success: function(res) {
        var result = res.result;
        var tableNo = that.parseTableNo(result);
        if (tableNo) {
          app.saveTableNoToStorage(tableNo);
          wx.switchTab({
            url: '/pages/menu/index'
          });
        } else {
          util.showToast('无效的桌码');
        }
      },
      fail: function(err) {
        console.error('扫码失败', err);
      }
    });
  },

  parseTableNo: function(qrCode) {
    if (qrCode.indexOf('table_') > -1) {
      var parts = qrCode.split('table_');
      if (parts.length > 1) {
        return parts[1];
      }
    }
    return null;
  },

  onDineInTap: function() {
    this.onScanQRCode();
  },

  onTakeoutTap: function() {
    app.globalData.orderType = 'pickup';
    wx.switchTab({
      url: '/pages/menu/index'
    });
  },

  onSearchTap: function() {
    wx.switchTab({
      url: '/pages/menu/index'
    });
  },

  onViewAllGoods: function() {
    wx.switchTab({
      url: '/pages/menu/index'
    });
  },

  onGoodsTap: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.switchTab({
      url: '/pages/menu/index'
    });
  },

  onOrderStatusTap: function(e) {
    var index = e.currentTarget.dataset.index;
    wx.switchTab({
      url: '/pages/orders/index'
    });
  },

  onViewAllOrders: function() {
    wx.switchTab({
      url: '/pages/orders/index'
    });
  }
});
