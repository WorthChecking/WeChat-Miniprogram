const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function generateCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.main = async (event, context) => {
  const { action, loginCode, wechatId, username, password, storeData } = event;

  try {
    if (action === 'getOpenId') {
      const wxContext = cloud.getWXContext();
      return { success: true, openid: wxContext.OPENID };
    }

    if (action === 'uploadImage') {
      var imageData = event.imageData;
      var fileName = event.fileName || 'image.jpg';
      if (!imageData) {
        return { success: false, errMsg: '缺少图片数据' };
      }
      try {
        var buffer = Buffer.from(imageData, 'base64');
        var cloudPath = 'goods/' + Date.now() + '_' + fileName;
        var uploadRes = await cloud.uploadFile({
          cloudPath: cloudPath,
          fileContent: buffer
        });
        return { success: true, fileID: uploadRes.fileID };
      } catch (uploadErr) {
        console.error('上传图片失败:', uploadErr);
        return { success: false, errMsg: '图片上传失败: ' + (uploadErr.message || '未知错误') };
      }
    }

    if (action === 'updateGoodsStatus') {
      var gId = event.goodsId;
      var gStatus = event.status;
      if (!gId) {
        return { success: false, errMsg: '缺少商品ID' };
      }
      try {
        await db.collection('goods').doc(gId).update({
          data: { status: gStatus }
        });
        return { success: true };
      } catch (statusErr) {
        console.error('更新商品状态失败:', statusErr);
        return { success: false, errMsg: '操作失败: ' + (statusErr.message || '未知错误') };
      }
    }

    if (action === 'toggleRecommend') {
      var goodsId = event.goodsId;
      var isRecommend = event.isRecommend;
      if (!goodsId) {
        return { success: false, errMsg: '缺少商品ID' };
      }
      try {
        await db.collection('goods').doc(goodsId).update({
          data: { isRecommend: isRecommend }
        });
        return { success: true };
      } catch (toggleErr) {
        console.error('更新推荐状态失败:', toggleErr);
        return { success: false, errMsg: '操作失败: ' + (toggleErr.message || '未知错误') };
      }
    }

    if (action === 'login') {
      if (!username || !username.trim()) {
        return { success: false, errMsg: '请输入账号' };
      }
      if (!password || !password.trim()) {
        return { success: false, errMsg: '请输入密码' };
      }
      var inputUsername = username.trim();
      var inputPassword = password.trim();

      if (inputUsername === 'admin') {
        if (inputPassword === '123456') {
          return { success: true, username: 'admin' };
        } else {
          return { success: false, errMsg: '密码错误' };
        }
      }

      var adminRes = await db.collection('admins')
        .where({ username: inputUsername })
        .limit(1)
        .get();
      if (!adminRes.data || adminRes.data.length === 0) {
        return { success: false, errMsg: '账号不存在' };
      }
      var adminDoc = adminRes.data[0];
      if (adminDoc.password !== inputPassword) {
        return { success: false, errMsg: '密码错误' };
      }
      return { success: true, username: inputUsername };
    }

    if (action === 'register') {
      if (!username || !username.trim()) {
        return { success: false, errMsg: '请输入账号' };
      }
      if (/[^a-zA-Z0-9]/.test(username.trim())) {
        return { success: false, errMsg: '账号只能由字母或数字组成' };
      }
      if (!password || !password.trim()) {
        return { success: false, errMsg: '请输入密码' };
      }
      var trimmedUsername = username.trim();

      if (trimmedUsername === 'admin') {
        return { success: false, alreadyExists: true, errMsg: '该账号已被注册' };
      }

      var existRes = await db.collection('admins')
        .where({ username: trimmedUsername })
        .limit(1)
        .get();
      if (existRes.data && existRes.data.length > 0) {
        return { success: false, alreadyExists: true, errMsg: '该账号已被注册' };
      }

      await db.collection('admins').add({
        data: {
          username: trimmedUsername,
          password: password.trim(),
          role: 'admin',
          createTime: new Date()
        }
      });
      return { success: true };
    }

    if (action === 'create') {
      const code = generateCode();
      await db.collection('adminLogins').add({
        data: {
          loginCode: code,
          status: 'pending',
          openid: '',
          createTime: new Date(),
          expireTime: new Date(Date.now() + 300000)
        }
      });
      return { success: true, loginCode: code };
    }

    if (action === 'poll') {
      const res = await db.collection('adminLogins')
        .where({ loginCode })
        .limit(1)
        .get();
      if (!res.data || res.data.length === 0) {
        return { success: false, errMsg: '登录码不存在' };
      }
      const record = res.data[0];
      if (record.status === 'confirmed') {
        await db.collection('adminLogins').doc(record._id).remove();
        return { success: true, openid: record.openid };
      }
      const now = new Date().getTime();
      var expTime = record.expireTime;
      if (typeof expTime === 'string') {
        expTime = new Date(expTime);
      }
      if (expTime && now > new Date(expTime).getTime()) {
        await db.collection('adminLogins').doc(record._id).update({
          data: { status: 'expired' }
        });
        return { success: false, expired: true };
      }
      return { success: false, status: 'pending' };
    }

    if (action === 'confirm') {
      if (!wechatId || !wechatId.trim()) {
        return { success: false, errMsg: '请输入微信号' };
      }
      var inputWechatId = wechatId.trim();

      const codeRes = await db.collection('adminLogins')
        .where({ loginCode })
        .limit(1)
        .get();
      if (!codeRes.data || codeRes.data.length === 0) {
        return { success: false, errMsg: '登录码不存在或已过期' };
      }
      const record = codeRes.data[0];
      if (record.status !== 'pending') {
        return { success: false, errMsg: '该登录码已被使用或已失效' };
      }

      var isAdmin = false;
      try {
        const adminRes = await db.collection('admins')
          .where({ wechatId: inputWechatId })
          .limit(1)
          .get();
        if (adminRes.data && adminRes.data.length > 0) {
          isAdmin = true;
        }
      } catch (e) {
        console.error('查询管理员失败:', e);
      }

      if (!isAdmin) {
        return { success: false, notAdmin: true, errMsg: '该账号未在管理员白名单中，请先注册' };
      }

      await db.collection('adminLogins').doc(record._id).update({
        data: {
          status: 'confirmed',
          openid: inputWechatId
        }
      });
      return { success: true };
    }

    if (action === 'getStore') {
      try {
        var storeRes = await db.collection('settings').doc('store_config').get();
        var doc = storeRes.data;
        if (doc) {
          return {
            success: true,
            data: {
              _id: 'store_config',
              name: doc.name || '',
              status: doc.status || '',
              notice: doc.notice || '',
              phone: doc.phone || '',
              openTime: doc.openTime || '',
              closeTime: doc.closeTime || ''
            }
          };
        }
      } catch (e) {
        console.error('getStore 查询失败:', e);
      }
      return { success: true, data: {} };
    }

    if (action === 'updateStore') {
      var _storeData = event.storeData;
      if (!_storeData) {
        return { success: false, errMsg: '缺少数据' };
      }
      try {
        var existDoc = null;
        try {
          var existStoreRes = await db.collection('settings').doc('store_config').get();
          existDoc = existStoreRes.data;
        } catch (e) { }
        if (existDoc) {
          await db.collection('settings').doc('store_config').update({
            data: {
              name: _storeData.name !== undefined ? _storeData.name : existDoc.name,
              status: _storeData.status !== undefined ? _storeData.status : existDoc.status,
              notice: _storeData.notice !== undefined ? _storeData.notice : existDoc.notice,
              phone: _storeData.phone !== undefined ? _storeData.phone : existDoc.phone,
              openTime: _storeData.openTime !== undefined ? _storeData.openTime : existDoc.openTime,
              closeTime: _storeData.closeTime !== undefined ? _storeData.closeTime : existDoc.closeTime
            }
          });
        } else {
          await db.collection('settings').doc('store_config').set({
            data: {
              name: _storeData.name || '',
              status: _storeData.status || '',
              notice: _storeData.notice || '',
              phone: _storeData.phone || '',
              openTime: _storeData.openTime || '',
              closeTime: _storeData.closeTime || ''
            }
          });
        }
        return { success: true };
      } catch (e) {
        console.error('updateStore 失败:', e);
        return { success: false, errMsg: e.message };
      }
    }

    if (action === 'updateDoc') {
      var collection = event.collection;
      var docId = event.docId;
      var updateData = event.data;
      if (!collection || !docId || !updateData) {
        return { success: false, errMsg: '缺少参数' };
      }
      try {
        var res = await db.collection(collection).doc(docId).update({ data: updateData });
        return { success: true, updated: res.updated || res.stats && res.stats.updated };
      } catch (e) {
        console.error('updateDoc 失败:', e);
        return { success: false, errMsg: e.message };
      }
    }

    return { success: false, errMsg: '未知操作' };
  } catch (err) {
    console.error('loginAdmin 错误:', err);
    return { success: false, errMsg: err.message || '服务器内部错误' };
  }
};
