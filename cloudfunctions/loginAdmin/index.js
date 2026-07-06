const cloud = require('wx-server-sdk');
const crypto = require('crypto');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const SALT_LEN = 16;
const KEY_LEN = 64;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;
const UPDATE_DOC_WHITELIST = ['categories', 'goods', 'settings', 'coupons'];

function hashPassword(password) {
  var salt = crypto.randomBytes(SALT_LEN).toString('hex');
  var hash = crypto.scryptSync(password, salt, KEY_LEN).toString('hex');
  return 'scrypt:' + salt + ':' + hash;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  if (stored.indexOf('scrypt:') === 0) {
    var parts = stored.split(':');
    if (parts.length !== 3) return false;
    var salt = parts[1];
    var expected = parts[2];
    var computed = crypto.scryptSync(password, salt, KEY_LEN).toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(computed, 'hex'));
    } catch (e) {
      return false;
    }
  }
  return stored === password;
}

function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

async function createSession(username) {
  var token = generateToken();
  await db.collection('adminSessions').add({
    data: {
      token: token,
      username: username,
      createTime: db.serverDate(),
      expireTime: new Date(Date.now() + TOKEN_TTL_MS)
    }
  });
  return token;
}

async function verifyAdminToken(token) {
  if (!token) return { valid: false, errMsg: '未登录' };
  try {
    var res = await db.collection('adminSessions')
      .where({ token: token })
      .limit(1)
      .get();
    if (!res.data || res.data.length === 0) {
      return { valid: false, errMsg: '登录已失效，请重新登录' };
    }
    var session = res.data[0];
    var expTime = session.expireTime;
    if (typeof expTime === 'string') expTime = new Date(expTime);
    if (expTime && Date.now() > new Date(expTime).getTime()) {
      return { valid: false, errMsg: '登录已过期，请重新登录' };
    }
    return { valid: true, username: session.username };
  } catch (e) {
    console.error('verifyAdminToken 失败:', e);
    return { valid: false, errMsg: '鉴权异常' };
  }
}

async function adminsCollectionEmpty() {
  try {
    var res = await db.collection('admins').limit(1).get();
    return !res.data || res.data.length === 0;
  } catch (e) {
    console.error('查询 admins 集合失败:', e);
    return false;
  }
}

function generateCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.main = async (event, context) => {
  const { action, loginCode, wechatId, username, password, storeData, token } = event;

  try {
    if (action === 'getOpenId') {
      const wxContext = cloud.getWXContext();
      return { success: true, openid: wxContext.OPENID };
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

      var adminRes = await db.collection('admins')
        .where({ username: inputUsername })
        .limit(1)
        .get();
      if (!adminRes.data || adminRes.data.length === 0) {
        return { success: false, errMsg: '账号不存在' };
      }
      var adminDoc = adminRes.data[0];
      if (!verifyPassword(inputPassword, adminDoc.password)) {
        return { success: false, errMsg: '密码错误' };
      }

      if (typeof adminDoc.password !== 'string' || adminDoc.password.indexOf('scrypt:') !== 0) {
        try {
          await db.collection('admins').doc(adminDoc._id).update({
            data: { password: hashPassword(inputPassword) }
          });
        } catch (upgradeErr) {
          console.error('密码哈希升级失败:', upgradeErr);
        }
      }

      var sessionToken = await createSession(inputUsername);
      return { success: true, username: inputUsername, token: sessionToken };
    }

    if (action === 'initAdmin') {
      if (await adminsCollectionEmpty()) {
        if (!username || !username.trim()) {
          return { success: false, errMsg: '请输入账号' };
        }
        if (/[^a-zA-Z0-9]/.test(username.trim())) {
          return { success: false, errMsg: '账号只能由字母或数字组成' };
        }
        if (!password || password.trim().length < 6) {
          return { success: false, errMsg: '密码至少 6 位' };
        }
        var initUsername = username.trim();
        await db.collection('admins').add({
          data: {
            username: initUsername,
            password: hashPassword(password.trim()),
            role: 'admin',
            createTime: new Date()
          }
        });
        return { success: true, message: '初始管理员创建成功，请删除该调用记录并使用账号登录' };
      }
      return { success: false, errMsg: '管理员已存在，禁止重复初始化' };
    }

    if (action === 'register') {
      var regAuth = await verifyAdminToken(token);
      if (!regAuth.valid) {
        return { success: false, unauthorized: true, errMsg: regAuth.errMsg };
      }
      if (!username || !username.trim()) {
        return { success: false, errMsg: '请输入账号' };
      }
      if (/[^a-zA-Z0-9]/.test(username.trim())) {
        return { success: false, errMsg: '账号只能由字母或数字组成' };
      }
      if (!password || password.trim().length < 6) {
        return { success: false, errMsg: '密码至少 6 位' };
      }
      var trimmedUsername = username.trim();

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
          password: hashPassword(password.trim()),
          role: 'admin',
          createTime: new Date()
        }
      });
      return { success: true };
    }

    if (action === 'verifyToken') {
      var vAuth = await verifyAdminToken(token);
      if (!vAuth.valid) {
        return { success: false, unauthorized: true, errMsg: vAuth.errMsg };
      }
      return { success: true, username: vAuth.username };
    }

    if (action === 'logout') {
      if (token) {
        try {
          var sessionRes = await db.collection('adminSessions')
            .where({ token: token })
            .limit(1)
            .get();
          if (sessionRes.data && sessionRes.data.length > 0) {
            await db.collection('adminSessions').doc(sessionRes.data[0]._id).remove();
          }
        } catch (e) {
          console.error('注销失败:', e);
        }
      }
      return { success: true };
    }

    if (action === 'changePassword') {
      var cpAuth = await verifyAdminToken(token);
      if (!cpAuth.valid) {
        return { success: false, unauthorized: true, errMsg: cpAuth.errMsg };
      }
      var oldPassword = event.oldPassword;
      var newPassword = event.newPassword;
      if (!oldPassword || !newPassword) {
        return { success: false, errMsg: '缺少原密码或新密码' };
      }
      if (newPassword.trim().length < 6) {
        return { success: false, errMsg: '新密码至少 6 位' };
      }
      var cpAdminRes = await db.collection('admins')
        .where({ username: cpAuth.username })
        .limit(1)
        .get();
      if (!cpAdminRes.data || cpAdminRes.data.length === 0) {
        return { success: false, errMsg: '账号不存在' };
      }
      var cpAdmin = cpAdminRes.data[0];
      if (!verifyPassword(oldPassword.trim(), cpAdmin.password)) {
        return { success: false, errMsg: '原密码错误' };
      }
      await db.collection('admins').doc(cpAdmin._id).update({
        data: { password: hashPassword(newPassword.trim()) }
      });
      return { success: true };
    }

    if (action === 'uploadImage') {
      var upAuth = await verifyAdminToken(token);
      if (!upAuth.valid) {
        return { success: false, unauthorized: true, errMsg: upAuth.errMsg };
      }
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
      var gsAuth = await verifyAdminToken(token);
      if (!gsAuth.valid) {
        return { success: false, unauthorized: true, errMsg: gsAuth.errMsg };
      }
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
      var trAuth = await verifyAdminToken(token);
      if (!trAuth.valid) {
        return { success: false, unauthorized: true, errMsg: trAuth.errMsg };
      }
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
      var usAuth = await verifyAdminToken(token);
      if (!usAuth.valid) {
        return { success: false, unauthorized: true, errMsg: usAuth.errMsg };
      }
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
      var udAuth = await verifyAdminToken(token);
      if (!udAuth.valid) {
        return { success: false, unauthorized: true, errMsg: udAuth.errMsg };
      }
      var collection = event.collection;
      var docId = event.docId;
      var updateData = event.data;
      if (!collection || !docId || !updateData) {
        return { success: false, errMsg: '缺少参数' };
      }
      if (UPDATE_DOC_WHITELIST.indexOf(collection) === -1) {
        return { success: false, errMsg: '不允许更新该集合' };
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
