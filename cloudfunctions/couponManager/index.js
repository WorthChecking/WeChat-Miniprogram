const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

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
    return { valid: false, errMsg: '鉴权异常' };
  }
}

exports.main = async (event, context) => {
  const { action } = event;

  try {
    if (action === 'createCoupon') {
      var a1 = await verifyAdminToken(event.token);
      if (!a1.valid) return { success: false, unauthorized: true, errMsg: a1.errMsg };
      return await createCoupon(event);
    }
    if (action === 'updateCoupon') {
      var a2 = await verifyAdminToken(event.token);
      if (!a2.valid) return { success: false, unauthorized: true, errMsg: a2.errMsg };
      return await updateCoupon(event);
    }
    if (action === 'deleteCoupon') {
      var a3 = await verifyAdminToken(event.token);
      if (!a3.valid) return { success: false, unauthorized: true, errMsg: a3.errMsg };
      return await deleteCoupon(event);
    }
    if (action === 'getCoupons') {
      var a4 = await verifyAdminToken(event.token);
      if (!a4.valid) return { success: false, unauthorized: true, errMsg: a4.errMsg };
      return await getCoupons(event);
    }
    if (action === 'setCouponGoods') {
      var a5 = await verifyAdminToken(event.token);
      if (!a5.valid) return { success: false, unauthorized: true, errMsg: a5.errMsg };
      return await setCouponGoods(event);
    }
    if (action === 'getUserCoupons') {
      return await getUserCoupons(event);
    }
    if (action === 'grantCoupon') {
      if (event.openid) {
        var a6 = await verifyAdminToken(event.token);
        if (!a6.valid) return { success: false, unauthorized: true, errMsg: a6.errMsg };
      }
      return await grantCoupon(event);
    }
    if (action === 'checkCouponUsable') {
      return await checkCouponUsable(event);
    }
    if (action === 'getCouponGoods') {
      return await getCouponGoods(event);
    }
    return { success: false, errMsg: '未知操作' };
  } catch (err) {
    console.error('couponManager 错误:', err);
    return { success: false, errMsg: err.message };
  }
};

async function createCoupon(event) {
  const { amount, scope, startDate, endDate } = event;
  if (!amount || !startDate || !endDate || !scope) {
    return { success: false, errMsg: '缺少必要参数' };
  }
  var scopeData = {
    type: scope.type || 'all',
    categoryIds: scope.categoryIds || []
  };
  const res = await db.collection('coupons').add({
    data: {
      amount: Number(amount),
      scope: scopeData,
      startDate: startDate,
      endDate: endDate,
      createTime: new Date(),
      status: 'active'
    }
  });
  return { success: true, id: res._id };
}

async function updateCoupon(event) {
  const { couponId, amount, scope, startDate, endDate, status } = event;
  if (!couponId) {
    return { success: false, errMsg: '缺少优惠券ID' };
  }
  var updateData = {};
  if (amount !== undefined) updateData.amount = Number(amount);
  if (scope !== undefined) {
    updateData.scope = {
      type: scope.type || 'all',
      categoryIds: scope.categoryIds || []
    };
  }
  if (startDate !== undefined) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate;
  if (status !== undefined) updateData.status = status;
  await db.collection('coupons').doc(couponId).update({ data: updateData });
  return { success: true };
}

async function deleteCoupon(event) {
  const { couponId } = event;
  if (!couponId) {
    return { success: false, errMsg: '缺少优惠券ID' };
  }
  await db.collection('coupons').doc(couponId).remove();
  return { success: true };
}

async function getCoupons(event) {
  const { status } = event;
  var query = db.collection('coupons').orderBy('createTime', 'desc');
  if (status && status !== 'all') {
    query = query.where({ status: status });
  }
  const res = await query.limit(100).get();
  return { success: true, data: res.data };
}

async function setCouponGoods(event) {
  const { couponId, goodsIds } = event;
  if (!couponId) {
    return { success: false, errMsg: '缺少优惠券ID' };
  }
  await db.collection('couponGoods').where({ couponId }).remove();
  var ids = goodsIds || [];
  for (var i = 0; i < ids.length; i++) {
    await db.collection('couponGoods').add({
      data: { couponId: couponId, goodsId: ids[i] }
    });
  }
  return { success: true };
}

async function getUserCoupons(event) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  if (!openid) {
    return { success: false, errMsg: '未获取到用户信息' };
  }
  const res = await db.collection('user_coupons')
    .where({ openid: openid, status: 'unused' })
    .orderBy('receiveTime', 'desc')
    .limit(100)
    .get();
  var list = [];
  for (var i = 0; i < res.data.length; i++) {
    var uc = res.data[i];
    var couponRes = await db.collection('coupons').doc(uc.couponId).get();
    if (couponRes.data) {
      var coupon = couponRes.data;
      var scope = coupon.scope || { type: 'all', categoryIds: [] };
      var hasGoods = true;
      if (scope.type === 'couponGoods') {
        var goodsRes = await db.collection('goods')
          .where({ isCouponGoods: true })
          .limit(1)
          .get();
        hasGoods = goodsRes.data && goodsRes.data.length > 0;
      } else if (scope.type === 'category') {
        var categoryIds = scope.categoryIds || [];
        if (categoryIds.length > 0) {
          var catGoodsRes = await db.collection('goods')
            .where({ categoryId: db.command.in(categoryIds) })
            .limit(1)
            .get();
          hasGoods = catGoodsRes.data && catGoodsRes.data.length > 0;
        } else {
          hasGoods = false;
        }
      }
      list.push({
        _id: uc._id,
        couponId: uc.couponId,
        amount: coupon.amount,
        scope: scope,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        receiveTime: uc.receiveTime,
        status: uc.status,
        hasGoods: hasGoods
      });
    }
  }
  return { success: true, data: list };
}

async function grantCoupon(event) {
  const { couponId, openid } = event;
  if (!couponId) {
    return { success: false, errMsg: '缺少优惠券ID' };
  }
  var targetOpenid = openid;
  if (!targetOpenid) {
    const wxContext = cloud.getWXContext();
    targetOpenid = wxContext.OPENID;
  }
  if (!targetOpenid) {
    return { success: false, errMsg: '未获取到用户信息' };
  }
  var existing = await db.collection('user_coupons')
    .where({ openid: targetOpenid, couponId: couponId, status: 'unused' })
    .get();
  if (existing.data && existing.data.length > 0) {
    return { success: false, errMsg: '用户已拥有该优惠券' };
  }
  await db.collection('user_coupons').add({
    data: {
      openid: targetOpenid,
      couponId: couponId,
      status: 'unused',
      receiveTime: new Date()
    }
  });
  return { success: true };
}

async function checkCouponUsable(event) {
  const { couponId, goodsIds } = event;
  if (!couponId) {
    return { success: false, errMsg: '缺少优惠券ID' };
  }
  var couponRes = await db.collection('coupons').doc(couponId).get();
  if (!couponRes.data) {
    return { success: false, errMsg: '优惠券不存在' };
  }
  var coupon = couponRes.data;
  var now = new Date();
  var startDate = coupon.startDate ? new Date(coupon.startDate) : null;
  var endDate = coupon.endDate ? new Date(coupon.endDate) : null;
  if (startDate && now < startDate) {
    return { success: true, usable: false, reason: '目前不在使用时段内' };
  }
  if (endDate && now > endDate) {
    return { success: true, usable: false, reason: '目前不在使用时段内' };
  }
  var scope = coupon.scope || { type: 'all', categoryIds: [] };
  if (scope.type === 'all') {
    return { success: true, usable: true, reason: '' };
  }
  if (!goodsIds || goodsIds.length === 0) {
    return { success: true, usable: false, reason: '目前无法使用该优惠券' };
  }
  if (scope.type === 'couponGoods') {
    var goodsRes = await db.collection('goods')
      .where({ _id: db.command.in(goodsIds), isCouponGoods: true })
      .limit(1)
      .get();
    if (goodsRes.data && goodsRes.data.length > 0) {
      return { success: true, usable: true, reason: '' };
    }
    return { success: true, usable: false, reason: '目前无法使用该优惠券' };
  }
  if (scope.type === 'category') {
    var categoryIds = scope.categoryIds || [];
    if (categoryIds.length === 0) {
      return { success: true, usable: false, reason: '目前无法使用该优惠券' };
    }
    var matchRes = await db.collection('goods')
      .where({
        _id: db.command.in(goodsIds),
        categoryId: db.command.in(categoryIds)
      })
      .limit(1)
      .get();
    if (matchRes.data && matchRes.data.length > 0) {
      return { success: true, usable: true, reason: '' };
    }
    return { success: true, usable: false, reason: '目前无法使用该优惠券' };
  }
  return { success: true, usable: false, reason: '目前无法使用该优惠券' };
}

async function getCouponGoods(event) {
  const { couponId } = event;
  if (!couponId) {
    return { success: false, errMsg: '缺少优惠券ID' };
  }
  const res = await db.collection('couponGoods')
    .where({ couponId: couponId })
    .limit(100)
    .get();
  return { success: true, data: res.data };
}
