var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    userInfo: null,
    assets: [
      { name: '优惠券', value: '3' },
      { name: '积分', value: '128' },
      { name: '余额', value: '50' }
    ],
    menuList: [
      { name: '我的地址', icon: '' },
      { name: '发票抬头', icon: '' },
      { name: '联系客服', icon: '' },
      { name: '意见反馈', icon: '' },
      { name: '关于我们', icon: '' }
    ]
  },

  onLoad: function(options) {
    this.loadUserInfo();
  },

  onShow: function() {
    this.loadUserInfo();
  },

  loadUserInfo: function() {
    var userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      app.globalData.userInfo = userInfo;
      this.setData({ userInfo: userInfo });
    }
  },

  onChooseAvatar: function(e) {
    var avatarUrl = e.detail.avatarUrl;
    var that = this;
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: function(res) {
        var userInfo = {
          avatarUrl: avatarUrl,
          nickName: res.userInfo.nickName
        };
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        that.setData({ userInfo: userInfo });
      },
      fail: function() {
        var userInfo = {
          avatarUrl: avatarUrl,
          nickName: '微信用户'
        };
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        that.setData({ userInfo: userInfo });
      }
    });
  },

  onMenuTap: function(e) {
    var index = e.currentTarget.dataset.index;
    var name = this.data.menuList[index].name;
    
    if (name === '联系客服') {
      wx.makePhoneCall({
        phoneNumber: '400-123-4567'
      });
    } else if (name === '关于我们') {
      wx.showModal({
        title: '关于我们',
        content: '美味小厨 - 让美食触手可及',
        showCancel: false
      });
    } else {
      util.showToast('功能开发中');
    }
  },

  onAssetTap: function(e) {
    var index = e.currentTarget.dataset.index;
    var name = this.data.assets[index].name;
    if (name === '优惠券') {
      wx.navigateTo({
        url: '/pages/coupons/index'
      });
    } else {
      util.showToast('功能开发中');
    }
  }
});
