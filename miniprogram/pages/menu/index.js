var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    categories: [],
    currentCategory: 0,
    groupedGoods: [],
    cart: [],
    cartTotal: 0,
    cartCount: 0,
    showSpecPopup: false,
    currentGoods: null,
    specForm: {
      specs: []
    },
    specAllSelected: false,
    loading: true,
    showSearch: false,
    searchKeyword: '',
    searchResults: [],
    goodsInCart: {},
    scrollTop: 0,
    sectionTops: [],
    _scrollTopFlag: 0,
    showCartPopup: false,
    orderType: 'dine-in',
    tableNo: '',
    remark: '',
    storeOpen: true
  },

  onLoad: function(options) {
    this.checkStoreStatus();
    this.updateCartInfo();
    this.startCategoryWatcher();
  },

  onUnload: function() {
    if (this._categoryWatcher) {
      this._categoryWatcher.close();
      this._categoryWatcher = null;
    }
  },

  onShow: function() {
    this.checkStoreStatus();
    this.loadAllData();
    this.updateCartInfo();
    this.updateCartBadge();
  },

  checkStoreStatus: function() {
    var that = this;
    util.getStoreInfo().then(function(storeInfo) {
      if (storeInfo.status === 'closed' || storeInfo.status === '已歇业') {
        wx.showModal({
          title: '提示',
          content: '未在营业时段中',
          showCancel: false
        });
      }
    });
  },

  startCategoryWatcher: function() {
    var that = this;
    var db = wx.cloud.database();
    that._categoryWatcher = db.collection('categories').where({
      _id: db.RegExp({ regexp: '.' })
    }).orderBy('sort', 'asc').limit(50).watch({
      onChange: function(snapshot) {
        if (snapshot.docChanges && snapshot.docChanges.length > 0) {
          that.loadAllData();
        }
      },
      onError: function(err) {
        console.error('分类监听错误:', err);
        if (that._categoryWatcher) {
          that._categoryWatcher.close();
          that._categoryWatcher = null;
        }
      }
    });
  },

  loadAllData: function() {
    var that = this;
    that.setData({ loading: true });
    
    Promise.all([util.getCategories(), util.getGoods()]).then(function(results) {
      var categories = results[0];
      var allGoods = results[1];
      
      var groupedGoods = [];
      for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        var catGoods = [];
        for (var j = 0; j < allGoods.length; j++) {
          if (allGoods[j].categoryId === cat._id || allGoods[j].category === cat._id) {
            catGoods.push(allGoods[j]);
          }
        }
        
        cat.goodsCount = catGoods.length;
        groupedGoods.push({
          _id: cat._id,
          categoryName: cat.name,
          goods: catGoods
        });
      }
      
      that.setData({
        categories: categories,
        groupedGoods: groupedGoods,
        loading: false
      });
      
      wx.nextTick(function() {
        setTimeout(function() {
          that.calcSectionTops();
        }, 300);
      });
      
      that.updateGoodsInCart();
    }).catch(function(err) {
      console.error('加载数据失败:', err);
      that.setData({ loading: false });
    });
  },

  calcSectionTops: function() {
    var that = this;
    var query = wx.createSelectorQuery().in(this);
    query.selectAll('.cate-section').boundingClientRect(function(rects) {
      if (rects && rects.length > 0) {
        var tops = [0];
        for (var i = 1; i < rects.length; i++) {
          tops[i] = tops[i - 1] + rects[i - 1].height;
        }
        that.setData({ sectionTops: tops });
      }
    }).exec();
  },

  onCategoryTap: function(e) {
    var index = e.currentTarget.dataset.index;
    var sectionTops = this.data.sectionTops;
    
    if (index < 0 || index >= sectionTops.length) return;
    
    var targetTop = sectionTops[index];
    var flag = this.data._scrollTopFlag + 1;
    
    this.setData({
      currentCategory: index,
      _scrollTopFlag: flag,
      scrollTop: targetTop + flag * 0.001,
      searchKeyword: '',
      searchResults: []
    });
  },

  onGoodsScroll: function(e) {
    var scrollTop = e.detail.scrollTop;
    var sectionTops = this.data.sectionTops;
    
    if (!sectionTops || sectionTops.length === 0) return;
    
    var activeIndex = 0;
    for (var i = sectionTops.length - 1; i >= 0; i--) {
      if (scrollTop >= sectionTops[i] - 5) {
        activeIndex = i;
        break;
      }
    }
    
    if (this.data.currentCategory !== activeIndex) {
      this.setData({ currentCategory: activeIndex });
    }
  },

  onSearchTap: function() {
    this.setData({
      showSearch: true
    });
  },

  onCloseSearch: function() {
    this.setData({
      showSearch: false,
      searchKeyword: '',
      searchResults: []
    });
  },

  onSearchInput: function(e) {
    var keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    if (keyword.length > 0) {
      this.searchGoods(keyword);
    } else {
      this.setData({
        searchResults: []
      });
    }
  },

  searchGoods: function(keyword) {
    var that = this;
    util.searchGoods(keyword).then(function(res) {
      that.setData({
        searchResults: res
      });
    });
  },

  updateCartInfo: function() {
    var cart = app.globalData.cart;
    var total = app.getCartTotal();
    var count = app.getCartCount();
    this.setData({
      cart: cart,
      cartTotal: total,
      cartCount: count
    });
    this.updateGoodsInCart();
  },

  updateGoodsInCart: function() {
    var cart = app.globalData.cart;
    var goodsInCart = {};
    
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      if (goodsInCart[item.id]) {
        goodsInCart[item.id] = goodsInCart[item.id] + item.quantity;
      } else {
        goodsInCart[item.id] = item.quantity;
      }
    }
    
    this.setData({
      goodsInCart: goodsInCart
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

  onAddToCart: function(e) {
    var id = e.currentTarget.dataset.id;
    var goods = null;
    
    var grouped = this.data.groupedGoods;
    for (var g = 0; g < grouped.length; g++) {
      for (var k = 0; k < grouped[g].goods.length; k++) {
        if (grouped[g].goods[k]._id === id) {
          goods = grouped[g].goods[k];
          break;
        }
      }
      if (goods) break;
    }
    
    if (!goods) {
      goods = this.data.searchResults.find(function(item) {
        return item._id === id;
      });
    }
    
    if (!goods) return;
    
    if (goods.needSpec) {
      this.openSpecPopupForGoods(goods);
    } else {
      this.addToCartDirectly(goods);
    }
  },

  openSpecPopupForGoods: function(goods) {
    var specGroups = goods.specGroups || [];
    var specs = [];
    for (var i = 0; i < specGroups.length; i++) {
      specs.push('');
    }
    this.setData({
      showSpecPopup: true,
      currentGoods: goods,
      specForm: { specs: specs },
      specAllSelected: false
    });
  },

  addToCartDirectly: function(goods) {
    var cartItem = {
      id: goods._id,
      name: goods.name,
      price: goods.price,
      image: goods.image,
      quantity: 1,
      specs: ''
    };
    
    app.addToCart(cartItem);
    this.updateCartInfo();
    this.updateCartBadge();
    util.showToast('已加入购物车');
  },

  onMinusFromCart: function(e) {
    var id = e.currentTarget.dataset.id;
    var cart = app.globalData.cart;
    var itemIndex = -1;
    
    for (var i = cart.length - 1; i >= 0; i--) {
      if (cart[i].id === id) {
        itemIndex = i;
        break;
      }
    }
    
    if (itemIndex === -1) return;
    
    if (cart[itemIndex].quantity > 1) {
      app.updateCartItemQuantity(itemIndex, cart[itemIndex].quantity - 1);
    } else {
      app.removeFromCart(itemIndex);
    }
    
    this.updateCartInfo();
    this.updateCartBadge();
  },

  onOpenSpecPopup: function(e) {
    var item = e.currentTarget.dataset.item;
    var specGroups = item.specGroups || [];
    var specs = [];
    for (var i = 0; i < specGroups.length; i++) {
      specs.push('');
    }
    this.setData({
      showSpecPopup: true,
      currentGoods: item,
      specForm: { specs: specs },
      specAllSelected: false
    });
  },

  onDynamicSpecSelect: function(e) {
    var idx = e.currentTarget.dataset.idx;
    var value = e.currentTarget.dataset.value;
    var specForm = this.data.specForm;
    specForm.specs[idx] = value;
    var allSelected = this.checkSpecAllSelected(specForm.specs);
    this.setData({
      specForm: specForm,
      specAllSelected: allSelected
    });
  },

  checkSpecAllSelected: function(specs) {
    for (var i = 0; i < specs.length; i++) {
      if (!specs[i]) return false;
    }
    return specs.length > 0;
  },

  onConfirmSpec: function() {
    if (!this.data.specAllSelected) {
      return;
    }
    var specForm = this.data.specForm;
    var goods = this.data.currentGoods;
    var specGroups = goods.specGroups || [];
    var specsText = '';
    for (var i = 0; i < specGroups.length; i++) {
      if (i > 0) specsText += '/';
      specsText += specGroups[i].name + ':' + specForm.specs[i];
    }
    var cartItem = {
      id: goods._id,
      name: goods.name,
      price: goods.price,
      image: goods.image,
      quantity: 1,
      specs: specsText,
      needSpec: true
    };
    app.addToCart(cartItem);
    this.updateCartInfo();
    this.updateCartBadge();
    this.closeSpecPopup();
    util.showToast('已加入购物车');
  },

  closeSpecPopup: function() {
    this.setData({
      showSpecPopup: false,
      currentGoods: null,
      specForm: { specs: [] },
      specAllSelected: false
    });
  },

  onGoToCart: function() {
    var tableNo = app.globalData.tableNo || '';
    var orderType = app.globalData.orderType || 'dine-in';
    this.setData({
      showCartPopup: true,
      cart: app.globalData.cart.slice(),
      tableNo: tableNo,
      orderType: orderType
    });
  },

  closeCartPopup: function() {
    this.setData({
      showCartPopup: false
    });
  },

  onOrderTypeChange: function(e) {
    var type = e.currentTarget.dataset.type;
    this.setData({
      orderType: type
    });
    app.globalData.orderType = type;
  },

  onRemarkInput: function(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  onCartQuantityChange: function(e) {
    var index = e.currentTarget.dataset.index;
    var type = e.currentTarget.dataset.type;
    
    if (type === 'minus') {
      if (app.globalData.cart[index].quantity > 1) {
        app.updateCartItemQuantity(index, app.globalData.cart[index].quantity - 1);
      } else {
        app.removeFromCart(index);
      }
    } else {
      app.updateCartItemQuantity(index, app.globalData.cart[index].quantity + 1);
    }
    
    this.setData({
      cart: app.globalData.cart.slice()
    });
    this.updateCartInfo();
    this.updateCartBadge();
    
    if (app.globalData.cart.length === 0) {
      this.closeCartPopup();
    }
  },

  onSubmitOrder: function() {
    var that = this;
    
    if (!that.data.storeOpen) {
      util.showToast('未在营业时段中');
      return;
    }
    
    if (that.data.cart.length === 0) {
      util.showToast('购物车为空');
      return;
    }
    
    if (that.data.orderType === 'dine-in' && !that.data.tableNo) {
      util.showToast('请选择桌号');
      return;
    }
    
    util.showLoading('提交中...');
    
    var orderData = {
      orderNo: util.generateOrderNo(),
      type: that.data.orderType,
      tableNo: that.data.orderType === 'dine-in' ? that.data.tableNo : '',
      items: that.data.cart,
      totalPrice: that.data.cartTotal,
      remark: that.data.remark,
      status: 'making',
      createTime: new Date(),
      pickupCode: that.generatePickupCode(),
      payStatus: 'unpaid'
    };
    
    util.createOrder(orderData).then(function(orderId) {
      util.hideLoading();
      app.clearCart();
      that.updateCartInfo();
      that.updateCartBadge();
      that.closeCartPopup();
      
      wx.redirectTo({
        url: '/pages/payment/index?orderId=' + orderId + '&orderNo=' + orderData.orderNo + '&totalPrice=' + orderData.totalPrice
      });
    }).catch(function(err) {
      util.hideLoading();
      util.showToast('提交失败，请重试');
      console.error('创建订单失败', err);
    });
  },

  generatePickupCode: function() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
});
