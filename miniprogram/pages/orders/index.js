var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    tabs: [
      { name: '全部', status: 'all' },
      { name: '制作中', status: 'making' },
      { name: '待取餐', status: 'pickup' },
      { name: '已完成', status: 'completed' }
    ],
    currentTab: 0,
    orders: [],
    loading: true,
    statusMap: {
      'pending': '待付款',
      'making': '制作中',
      'pickup': '待取餐',
      'completed': '已完成',
      'canceled': '已取消'
    },
    orderWatcher: null
  },

  onLoad: function(options) {
    this.loadOrders();
  },

  onShow: function() {
    this.loadOrders();
    this.startOrderListWatcher();
  },

  onHide: function() {
    this.stopOrderWatcher();
  },

  onUnload: function() {
    this.stopOrderWatcher();
  },

  onPullDownRefresh: function() {
    var that = this;
    that.loadOrders().then(function() {
      wx.stopPullDownRefresh();
    });
  },

  onTabTap: function(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({
      currentTab: index,
      loading: true
    });
    this.loadOrders();
  },

  loadOrders: function() {
    var that = this;
    var status = that.data.tabs[that.data.currentTab].status;
    
    return util.getMyOrders(status).then(function(res) {
      for (var i = 0; i < res.length; i++) {
        res[i].createTimeFormatted = util.formatDate(res[i].createTime);
      }
      that.setData({
        orders: res,
        loading: false
      });
    }).catch(function(err) {
      console.error('加载订单失败', err);
      that.setData({
        loading: false,
        orders: []
      });
    });
  },

  startOrderListWatcher: function() {
    var that = this;
    var db = util.getDb();
    
    that.stopOrderWatcher();
    
    that.data.orderWatcher = db.collection('orders').where({
      _openid: '{openid}'
    }).watch({
      onChange: function(snapshot) {
        console.log('订单列表变化', snapshot);
        if (snapshot.docChanges && snapshot.docChanges.length > 0) {
          that.loadOrders();
        }
      },
      onError: function(err) {
        console.error('订单列表监听错误', err);
      }
    });
  },

  stopOrderWatcher: function() {
    if (this.data.orderWatcher) {
      this.data.orderWatcher.close();
      this.data.orderWatcher = null;
    }
  },

  onOrderTap: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/orderDetail/index?id=' + id
    });
  },

  onReorderTap: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.switchTab({
      url: '/pages/menu/index'
    });
  },

  onPayNow: function(e) {
    var order = e.currentTarget.dataset.order;
    wx.navigateTo({
      url: '/pages/payment/index?orderId=' + order._id + '&orderNo=' + order.orderNo + '&totalPrice=' + order.totalPrice
    });
  },

  formatTime: function(date) {
    return util.formatDate(date);
  }
});
