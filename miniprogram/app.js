App({
  onLaunch: function(options) {
    this.globalData = {
      env: "YOUR_ENV_ID",
      userInfo: null,
      cart: [],
      tableNo: '',
      orderType: 'dine-in',
      selectedCoupon: null,
      selectedCouponId: ''
    };
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
    
    this.loadCartFromStorage();
    this.loadTableNoFromStorage();
  },
  
  loadCartFromStorage: function() {
    try {
      var cart = wx.getStorageSync('cart');
      if (cart) {
        this.globalData.cart = cart;
      }
    } catch (e) {
      console.error('读取购物车失败', e);
    }
  },
  
  saveCartToStorage: function() {
    try {
      wx.setStorageSync('cart', this.globalData.cart);
    } catch (e) {
      console.error('保存购物车失败', e);
    }
  },
  
  loadTableNoFromStorage: function() {
    try {
      var tableNo = wx.getStorageSync('tableNo');
      if (tableNo) {
        this.globalData.tableNo = tableNo;
      }
    } catch (e) {
      console.error('读取桌号失败', e);
    }
  },
  
  saveTableNoToStorage: function(tableNo) {
    try {
      wx.setStorageSync('tableNo', tableNo);
      this.globalData.tableNo = tableNo;
    } catch (e) {
      console.error('保存桌号失败', e);
    }
  },
  
  addToCart: function(item) {
    var cart = this.globalData.cart;
    var existIndex = -1;
    
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === item.id && cart[i].specs === item.specs) {
        existIndex = i;
        break;
      }
    }
    
    if (existIndex > -1) {
      cart[existIndex].quantity = cart[existIndex].quantity + item.quantity;
    } else {
      cart.push(item);
    }
    
    this.saveCartToStorage();
  },
  
  removeFromCart: function(index) {
    this.globalData.cart.splice(index, 1);
    this.saveCartToStorage();
  },
  
  updateCartItemQuantity: function(index, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(index);
    } else {
      this.globalData.cart[index].quantity = quantity;
      this.saveCartToStorage();
    }
  },
  
  clearCart: function() {
    this.globalData.cart = [];
    this.saveCartToStorage();
  },
  
  getCartTotal: function() {
    var total = 0;
    var cart = this.globalData.cart;
    for (var i = 0; i < cart.length; i++) {
      total = total + cart[i].price * cart[i].quantity;
    }
    return total;
  },
  
  getCartCount: function() {
    var count = 0;
    var cart = this.globalData.cart;
    for (var i = 0; i < cart.length; i++) {
      count = count + cart[i].quantity;
    }
    return count;
  }
});
