var util = require('../../utils/util.js');
var app = getApp();

Page({
  data: {
    coupons: [],
    selectedId: '',
    cartGoodsIds: [],
    loading: true
  },

  onLoad: function(options) {
    var that = this;
    var cart = app.globalData.cart || [];
    var cartGoodsIds = cart.map(function(item) { return item.goodsId || item.id; });
    that.setData({ cartGoodsIds: cartGoodsIds });
    
    var selectedId = app.globalData.selectedCouponId || '';
    that.setData({ selectedId: selectedId });
    
    that.loadCoupons();
  },

  loadCoupons: function() {
    var that = this;
    that.setData({ loading: true });
    util.getUserCoupons().then(function(list) {
      var now = new Date();
      var cartGoodsIds = that.data.cartGoodsIds;
      var processed = list.map(function(item) {
        var startDate = item.startDate ? new Date(item.startDate) : null;
        var endDate = item.endDate ? new Date(item.endDate) : null;
        var inPeriod = true;
        
        if (startDate && now < startDate) inPeriod = false;
        if (endDate && now > endDate) inPeriod = false;
        
        var scope = item.scope || { type: 'all', categoryIds: [] };
        var canUse = inPeriod;
        
        if (canUse) {
          if (scope.type === 'all') {
            canUse = true;
          } else if (scope.type === 'couponGoods') {
            canUse = item.hasGoods !== false;
          } else if (scope.type === 'category') {
            canUse = item.hasGoods !== false;
          } else {
            canUse = false;
          }
        }
        
        var scopeText = that.getScopeText(scope);
        
        return {
          _id: item._id,
          couponId: item.couponId,
          amount: item.amount,
          scopeText: scopeText,
          startDate: item.startDate,
          endDate: item.endDate,
          canUse: canUse,
          inPeriod: inPeriod,
          hasGoods: item.hasGoods !== false
        };
      });
      that.setData({ coupons: processed, loading: false });
    }).catch(function() {
      that.setData({ coupons: [], loading: false });
    });
  },

  getScopeText: function(scope) {
    if (!scope) return '全部商品可用';
    if (scope.type === 'all') return '全部商品可用';
    if (scope.type === 'couponGoods') return '仅优惠商品可用';
    if (scope.type === 'category') return '指定分类可用';
    return '全部商品可用';
  },

  onSelectCoupon: function(e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    var coupon = that.data.coupons.find(function(c) { return c._id === id; });
    if (!coupon || !coupon.canUse) return;
    
    if (that.data.selectedId === id) {
      that.setData({ selectedId: '' });
    } else {
      that.setData({ selectedId: id });
    }
  },

  onConfirm: function() {
    var that = this;
    var selectedId = that.data.selectedId;
    if (selectedId) {
      var coupon = that.data.coupons.find(function(c) { return c._id === selectedId; });
      app.globalData.selectedCoupon = coupon;
      app.globalData.selectedCouponId = selectedId;
    } else {
      app.globalData.selectedCoupon = null;
      app.globalData.selectedCouponId = '';
    }
    wx.navigateBack();
  },

  onClearCoupon: function() {
    this.setData({ selectedId: '' });
  }
});