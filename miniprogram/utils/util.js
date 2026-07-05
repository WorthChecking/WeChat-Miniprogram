var app = getApp();

var formatDate = function(date) {
  if (!date) return '';
  var d = new Date(date);
  var year = d.getFullYear();
  var month = (d.getMonth() + 1).toString().padStart(2, '0');
  var day = d.getDate().toString().padStart(2, '0');
  var hour = d.getHours().toString().padStart(2, '0');
  var minute = d.getMinutes().toString().padStart(2, '0');
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
};

var generateOrderNo = function() {
  var now = new Date();
  var year = now.getFullYear();
  var month = (now.getMonth() + 1).toString().padStart(2, '0');
  var day = now.getDate().toString().padStart(2, '0');
  var hour = now.getHours().toString().padStart(2, '0');
  var minute = now.getMinutes().toString().padStart(2, '0');
  var second = now.getSeconds().toString().padStart(2, '0');
  var random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return 'ORD' + year + month + day + hour + minute + second + random;
};

var showToast = function(title, icon) {
  icon = icon || 'none';
  wx.showToast({
    title: title,
    icon: icon,
    duration: 2000
  });
};

var showLoading = function(title) {
  title = title || '加载中...';
  wx.showLoading({
    title: title,
    mask: true
  });
};

var hideLoading = function() {
  wx.hideLoading();
};

var showConfirm = function(content, confirmText, cancelText) {
  confirmText = confirmText || '确定';
  cancelText = cancelText || '取消';
  return new Promise(function(resolve, reject) {
    wx.showModal({
      title: '提示',
      content: content,
      confirmText: confirmText,
      cancelText: cancelText,
      success: function(res) {
        if (res.confirm) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
};

var db = null;

var getDb = function() {
  if (!db) {
    db = wx.cloud.database();
  }
  return db;
};

var getStoreInfo = function() {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    database.collection('settings').doc('store_config').get({
      success: function(res) {
        var data = res.data;
        if (data) {
          var status = data.status;
          if (status === 'open' || status === '营业中') {
            status = '营业中';
          } else {
            status = '已歇业';
          }
          resolve({
            name: data.name || '',
            status: status,
            notice: data.notice || '',
            phone: data.phone || '',
            openTime: data.openTime || '',
            closeTime: data.closeTime || ''
          });
        } else {
          resolve({});
        }
      },
      fail: function(err) {
        console.error('获取店铺信息失败', err);
        resolve({});
      }
    });
  });
};

var getCategories = function() {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    database.collection('categories').orderBy('sort', 'asc').limit(50).get().then(function(res) {
      resolve(res.data);
    }).catch(function(err) {
      console.error('获取分类失败', err);
      resolve([]);
    });
  });
};

var getGoods = function(categoryId) {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    var query = database.collection('goods').where({
      status: 'active'
    });
    if (categoryId) {
      query = query.where({
        categoryId: categoryId
      });
    }
    fetchAllGoods(query).then(function(list) {
      resolve(list);
    }).catch(function(err) {
      console.error('获取商品失败', err);
      resolve([]);
    });
  });
};

var fetchAllGoods = function(query) {
  return new Promise(function(resolve) {
    var allList = [];
    var pageSize = 20;
    function fetchPage(skip) {
      query.skip(skip).limit(pageSize).get().then(function(res) {
        var data = res.data || [];
        allList = allList.concat(data);
        if (data.length === pageSize) {
          fetchPage(skip + pageSize);
        } else {
          resolve(allList);
        }
      }).catch(function() {
        resolve(allList);
      });
    }
    fetchPage(0);
  });
};

var getRecommendGoods = function() {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    database.collection('goods').where({
      status: 'active'
    }).orderBy('sort', 'asc').limit(50).get().then(function(res) {
      var allGoods = res.data || [];
      var recommendList = allGoods.filter(function(item) {
        return item.isRecommend === true || item.isRecommend === 'true';
      });
      console.log('所有商品数:', allGoods.length, '推荐商品数:', recommendList.length);
      resolve(recommendList.slice(0, 4));
    }).catch(function(err) {
      console.error('获取推荐商品失败', err);
      resolve([]);
    });
  });
};

var createOrder = function(orderData) {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    database.collection('orders').add({
      data: orderData
    }).then(function(res) {
      resolve(res._id);
    }).catch(function(err) {
      console.error('创建订单失败', err);
      reject(err);
    });
  });
};

var getMyOrders = function(status, limit, skip) {
  limit = limit || 20;
  skip = skip || 0;
  return new Promise(function(resolve, reject) {
    var database = getDb();
    var query = database.collection('orders');
    if (status && status !== 'all') {
      query = query.where({
        status: status
      });
    }
    query.orderBy('createTime', 'desc').skip(skip).limit(limit).get().then(function(res) {
      resolve(res.data);
    }).catch(function(err) {
      console.error('获取订单列表失败', err);
      reject(err);
    });
  });
};

var getOrderById = function(orderId) {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    database.collection('orders').doc(orderId).get().then(function(res) {
      resolve(res.data);
    }).catch(function(err) {
      console.error('获取订单详情失败', err);
      reject(err);
    });
  });
};

var createPayment = function(orderId) {
  return new Promise(function(resolve, reject) {
    wx.cloud.callFunction({
      name: 'createPayment',
      data: {
        orderId: orderId
      }
    }).then(function(res) {
      if (res.result.success) {
        resolve(res.result.payment);
      } else {
        reject(new Error(res.result.errMsg || '创建支付失败'));
      }
    }).catch(function(err) {
      console.error('调用支付云函数失败', err);
      reject(err);
    });
  });
};

var requestPayment = function(payment) {
  return new Promise(function(resolve, reject) {
    wx.requestPayment({
      timeStamp: payment.timeStamp,
      nonceStr: payment.nonceStr,
      package: payment.package,
      signType: payment.signType || 'MD5',
      paySign: payment.paySign,
      success: function(res) {
        resolve(res);
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
};

var payOrder = function(orderId) {
  return new Promise(function(resolve, reject) {
    createPayment(orderId).then(function(payment) {
      return requestPayment(payment);
    }).then(function(res) {
      resolve(res);
    }).catch(function(err) {
      reject(err);
    });
  });
};

var searchGoods = function(keyword) {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    database.collection('goods').where({
      status: 'active',
      name: database.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).orderBy('sort', 'asc').get().then(function(res) {
      resolve(res.data);
    }).catch(function(err) {
      console.error('搜索商品失败', err);
      resolve([]);
    });
  });
};

var getGoodsBySort = function(sortType, categoryId) {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    var query = database.collection('goods').where({
      status: 'active'
    });
    
    if (categoryId) {
      query = query.where({
        categoryId: categoryId
      });
    }
    
    var orderByField = 'sort';
    if (sortType === 'sales') {
      orderByField = 'sales';
    } else if (sortType === 'price_asc') {
      orderByField = 'price';
    } else if (sortType === 'price_desc') {
      orderByField = 'price';
    }
    
    query.orderBy(orderByField, sortType === 'price_desc' ? 'desc' : 'asc').get().then(function(res) {
      resolve(res.data);
    }).catch(function(err) {
      console.error('获取商品失败', err);
      resolve([]);
    });
  });
};

var getUserCoupons = function() {
  return new Promise(function(resolve, reject) {
    wx.cloud.callFunction({
      name: 'couponManager',
      data: { action: 'getUserCoupons' }
    }).then(function(res) {
      if (res.result.success) {
        resolve(res.result.data);
      } else {
        resolve([]);
      }
    }).catch(function(err) {
      console.error('获取优惠券失败', err);
      resolve([]);
    });
  });
};

var useCoupon = function(userCouponId) {
  return new Promise(function(resolve, reject) {
    var database = getDb();
    database.collection('user_coupons').doc(userCouponId).update({
      data: { status: 'used', useTime: new Date() }
    }).then(function() {
      resolve(true);
    }).catch(function(err) {
      console.error('使用优惠券失败', err);
      reject(err);
    });
  });
};

var getCouponGoods = function(couponId) {
  return new Promise(function(resolve, reject) {
    wx.cloud.callFunction({
      name: 'couponManager',
      data: { action: 'getCouponGoods', couponId: couponId }
    }).then(function(res) {
      if (res.result.success) {
        resolve(res.result.data);
      } else {
        resolve([]);
      }
    }).catch(function(err) {
      console.error('获取优惠商品失败', err);
      resolve([]);
    });
  });
};

module.exports = {
  formatDate: formatDate,
  generateOrderNo: generateOrderNo,
  showToast: showToast,
  showLoading: showLoading,
  hideLoading: hideLoading,
  showConfirm: showConfirm,
  getDb: getDb,
  getStoreInfo: getStoreInfo,
  getCategories: getCategories,
  getGoods: getGoods,
  getRecommendGoods: getRecommendGoods,
  createOrder: createOrder,
  getMyOrders: getMyOrders,
  getOrderById: getOrderById,
  createPayment: createPayment,
  requestPayment: requestPayment,
  payOrder: payOrder,
  searchGoods: searchGoods,
  getGoodsBySort: getGoodsBySort,
  getUserCoupons: getUserCoupons,
  useCoupon: useCoupon,
  getCouponGoods: getCouponGoods
};
