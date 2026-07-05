var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    cart: [],
    orderType: 'dine-in',
    tableNo: '',
    remark: '',
    totalPrice: 0,
    storeOpen: true,
    selectedCoupon: null,
    selectedCouponId: '',
    couponDiscount: 0,
    finalPrice: 0,
    statusMap: {
      'pending': '待付款',
      'making': '制作中',
      'pickup': '待取餐',
      'completed': '已完成',
      'canceled': '已取消'
    }
  },

  onLoad: function(options) {
    this.loadCartInfo();
    this.checkStoreStatus();
  },

  onShow: function() {
    this.loadCartInfo();
    this.updateCartBadge();
    this.checkStoreStatus();
  },

  loadCartInfo: function() {
    var cart = app.globalData.cart;
    var tableNo = app.globalData.tableNo;
    var orderType = app.globalData.orderType;
    var totalPrice = app.getCartTotal();
    var selectedCoupon = app.globalData.selectedCoupon || null;
    var selectedCouponId = app.globalData.selectedCouponId || '';
    var couponDiscount = 0;
    var finalPrice = totalPrice;
    
    if (selectedCoupon) {
      couponDiscount = selectedCoupon.amount;
      finalPrice = totalPrice - couponDiscount;
      if (finalPrice < 0) finalPrice = 0;
    }
    
    this.setData({
      cart: cart,
      tableNo: tableNo,
      orderType: orderType,
      totalPrice: totalPrice,
      selectedCoupon: selectedCoupon,
      selectedCouponId: selectedCouponId,
      couponDiscount: couponDiscount,
      finalPrice: finalPrice
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

  onOrderTypeChange: function(e) {
    var type = e.currentTarget.dataset.type;
    this.setData({
      orderType: type
    });
    app.globalData.orderType = type;
  },

  onQuantityChange: function(e) {
    var index = e.currentTarget.dataset.index;
    var type = e.currentTarget.dataset.type;
    var cart = this.data.cart;
    
    if (type === 'minus') {
      if (cart[index].quantity > 1) {
        cart[index].quantity = cart[index].quantity - 1;
      } else {
        cart.splice(index, 1);
      }
    } else {
      cart[index].quantity = cart[index].quantity + 1;
    }
    
    app.globalData.cart = cart;
    app.saveCartToStorage();
    this.loadCartInfo();
    this.updateCartBadge();
  },

  onRemarkInput: function(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  onSelectCoupon: function() {
    wx.navigateTo({
      url: '/pages/couponSelect/index'
    });
  },

  onSubmitOrder: function() {
    var that = this;
    var cart = that.data.cart;
    
    if (!that.data.storeOpen) {
      util.showToast('未在营业时段中');
      return;
    }
    
    if (cart.length === 0) {
      util.showToast('购物车为空');
      return;
    }
    
    if (that.data.orderType === 'dine-in' && !that.data.tableNo) {
      util.showToast('请先扫码选择桌号');
      return;
    }
    
    util.showConfirm('确认提交订单？').then(function(confirm) {
      if (confirm) {
        that.createOrder();
      }
    });
  },

  createOrder: function() {
    var that = this;
    util.showLoading('提交中...');
    
    var orderData = {
      orderNo: util.generateOrderNo(),
      type: that.data.orderType,
      tableNo: that.data.orderType === 'dine-in' ? that.data.tableNo : '',
      items: that.data.cart,
      totalPrice: that.data.totalPrice,
      couponDiscount: that.data.couponDiscount,
      finalPrice: that.data.finalPrice,
      couponId: that.data.selectedCouponId,
      remark: that.data.remark,
      status: 'making',
      createTime: new Date(),
      pickupCode: that.generatePickupCode(),
      payStatus: 'unpaid'
    };
    
    util.createOrder(orderData).then(function(orderId) {
      util.hideLoading();
      
      if (that.data.selectedCouponId) {
        util.useCoupon(that.data.selectedCouponId).catch(function() {});
      }
      
      app.clearCart();
      app.globalData.selectedCoupon = null;
      app.globalData.selectedCouponId = '';
      that.updateCartBadge();
      
      wx.redirectTo({
        url: '/pages/payment/index?orderId=' + orderId + '&orderNo=' + orderData.orderNo + '&totalPrice=' + orderData.finalPrice
      });
    }).catch(function(err) {
      util.hideLoading();
      util.showToast('提交失败，请重试');
      console.error('创建订单失败', err);
    });
  },

  generatePickupCode: function() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  },

  checkStoreStatus: function() {
    var that = this;
    util.getStoreInfo().then(function(storeInfo) {
      var isOpen = storeInfo.status !== 'closed' && storeInfo.status !== '已歇业';
      that.setData({
        storeOpen: isOpen
      });
    }).catch(function() {
      that.setData({
        storeOpen: true
      });
    });
  }
});
