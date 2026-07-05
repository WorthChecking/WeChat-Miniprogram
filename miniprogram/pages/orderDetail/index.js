var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    order: null,
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
    var id = options.id;
    if (id) {
      this.loadOrderDetail(id);
    }
  },

  onShow: function() {},

  onUnload: function() {
    this.stopOrderWatcher();
  },

  loadOrderDetail: function(orderId) {
    var that = this;
    util.showLoading('加载中...');
    
    util.getOrderById(orderId).then(function(res) {
      util.hideLoading();
      res.createTimeFormatted = util.formatDate(res.createTime);
      that.setData({
        order: res,
        loading: false
      });
      
      that.startOrderWatcher(orderId);
    }).catch(function(err) {
      util.hideLoading();
      util.showToast('加载失败');
      console.error('加载订单详情失败', err);
      that.setData({
        loading: false
      });
    });
  },

  startOrderWatcher: function(orderId) {
    var that = this;
    var db = util.getDb();
    
    that.stopOrderWatcher();
    
    that.data.orderWatcher = db.collection('orders').doc(orderId).watch({
      onChange: function(snapshot) {
        console.log('订单变化', snapshot);
        if (snapshot.docChanges && snapshot.docChanges.length > 0) {
          var change = snapshot.docChanges[0];
          if (change.dataType === 'update') {
            var order = that.data.order;
            order.status = change.updatedFields.status || order.status;
            order.payStatus = change.updatedFields.payStatus || order.payStatus;
            that.setData({
              order: order
            });
            
            that.showStatusNotification(order.status);
          }
        }
      },
      onError: function(err) {
        console.error('订单监听错误', err);
      }
    });
  },

  stopOrderWatcher: function() {
    if (this.data.orderWatcher) {
      this.data.orderWatcher.close();
      this.data.orderWatcher = null;
    }
  },

  showStatusNotification: function(status) {
    var statusMap = this.data.statusMap;
    var statusText = statusMap[status] || status;
    var order = this.data.order;
    
    if (status === 'making') {
      wx.showModal({
        title: '订单状态更新',
        content: '您的订单已开始制作，请耐心等待',
        showCancel: false
      });
    } else if (status === 'pickup') {
      wx.showModal({
        title: '订单状态更新',
        content: '您的订单已制作完成，请凭取餐码取餐',
        showCancel: false
      });
    } else if (status === 'completed' && order && order.type === 'dine-in') {
      wx.showModal({
        title: '订单状态更新',
        content: '您的餐品已出，请享用',
        showCancel: false
      });
    }
  },

  onConfirmPickup: function() {
    var that = this;
    var order = that.data.order;
    
    util.showConfirm('确认已取餐？').then(function(confirm) {
      if (confirm) {
        that.updateOrderStatus('completed');
      }
    });
  },

  updateOrderStatus: function(status) {
    var that = this;
    var order = that.data.order;
    var db = util.getDb();
    
    util.showLoading('处理中...');
    
    db.collection('orders').doc(order._id).update({
      data: {
        status: status
      }
    }).then(function() {
      util.hideLoading();
      var order = that.data.order;
      order.status = status;
      that.setData({
        order: order
      });
      util.showToast('操作成功');
    }).catch(function(err) {
      util.hideLoading();
      util.showToast('操作失败');
      console.error('更新订单状态失败', err);
    });
  },

  formatTime: function(date) {
    return util.formatDate(date);
  },

  onCopyOrderNo: function() {
    var order = this.data.order;
    wx.setClipboardData({
      data: order.orderNo,
      success: function() {
        util.showToast('已复制');
      }
    });
  },

  onPayNow: function() {
    var order = this.data.order;
    wx.redirectTo({
      url: '/pages/payment/index?orderId=' + order._id + '&orderNo=' + order.orderNo + '&totalPrice=' + order.totalPrice
    });
  }
});
