var util = require('../../utils/util.js');

Page({
  data: {
    coupons: [],
    loading: true
  },

  onLoad: function() {
    this.loadCoupons();
  },

  onShow: function() {
    this.loadCoupons();
  },

  loadCoupons: function() {
    var that = this;
    that.setData({ loading: true });
    util.getUserCoupons().then(function(list) {
      var now = new Date();
      var processed = list.map(function(item) {
        var startDate = item.startDate ? new Date(item.startDate) : null;
        var endDate = item.endDate ? new Date(item.endDate) : null;
        var inPeriod = true;
        
        if (startDate && now < startDate) inPeriod = false;
        if (endDate && now > endDate) inPeriod = false;
        
        var hasGoods = item.hasGoods !== false;
        
        var disabled = false;
        var disabledTip = '';
        if (!hasGoods) {
          disabled = true;
          disabledTip = '目前无法使用该优惠券';
        } else if (!inPeriod) {
          disabled = true;
          disabledTip = '目前不在使用时段内';
        }
        
        var scopeText = that.getScopeText(item.scope);
        
        return {
          _id: item._id,
          couponId: item.couponId,
          amount: item.amount,
          scopeText: scopeText,
          startDate: that.formatDate(item.startDate),
          endDate: that.formatDate(item.endDate),
          disabled: disabled,
          disabledTip: disabledTip,
          expanded: false
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
    if (scope.type === 'category') {
      var ids = scope.categoryIds || [];
      if (ids.length === 0) return '未指定分类';
      return '指定分类可用';
    }
    return '全部商品可用';
  },

  onToggleExpand: function(e) {
    var index = e.currentTarget.dataset.index;
    var key = 'coupons[' + index + '].expanded';
    var current = this.data.coupons[index].expanded;
    this.setData({ [key]: !current });
  },

  onUseCoupon: function(e) {
    var index = e.currentTarget.dataset.index;
    var coupon = this.data.coupons[index];
    if (coupon.disabled) {
      wx.showToast({ title: coupon.disabledTip, icon: 'none', duration: 2000 });
      return;
    }
    wx.switchTab({
      url: '/pages/menu/index'
    });
  },

  formatDate: function(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = (d.getMonth() + 1);
    var day = d.getDate();
    return y + '.' + m + '.' + day;
  }
});