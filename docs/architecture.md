# 技术架构与数据库设计

本文档说明 William 厨房点餐系统的整体架构、云数据库集合结构、订单状态机与支付流程。是 [README.md](../README.md) 的技术补充。

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      微信云开发（CloudBase）                  │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │  云函数 (10)  │   │  云数据库 (8) │   │   云存储      │    │
│  │              │   │              │   │              │    │
│  │ createOrder  │──▶│ orders       │   │ goods/       │    │
│  │ createPayment│──▶│ goods        │   │ (商品图片)    │    │
│  │ payCallback  │──▶│ coupons      │   └──────────────┘    │
│  │ cancelAndRefund│ │ tableCodes   │                       │
│  │ ...          │   │ admins       │   ┌──────────────┐    │
│  └──────┬───────┘   │ settings     │   │  云支付       │    │
│         │           └──────────────┘   │ cloudPay     │    │
│         │                              └──────┬───────┘    │
└─────────┼─────────────────────────────────────┼────────────┘
          │                                     │
          │ wx.cloud.callFunction               │ 微信支付
          │                                     │ 退款
   ┌──────┴──────────┐                  ┌───────┴────────┐
   │  小程序端 (C 端)  │                  │  微信支付平台    │
   │  WXML/WXSS/JS    │                  └────────────────┘
   │  9 个页面         │
   └──────────────────┘
          │
          │ HTTPS (Vite build → 静态托管)
          │
   ┌──────┴──────────┐
   │  管理后台 (B 端)  │
   │  Vue 3 + Vite 5  │
   │  @cloudbase/js-sdk│
   └──────────────────┘
```

**通信方式**：
- 小程序端 → 云函数：`wx.cloud.callFunction`
- 小程序端 → 云数据库：`wx.cloud.database`（受权限规则限制）
- 管理后台 → 云函数/数据库：`@cloudbase/js-sdk`
- 云函数 → 微信支付：`cloud.cloudPay.unifiedOrder`

## 📊 云数据库集合结构

### `orders` — 订单

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 订单 ID（自动生成） |
| `orderNo` | string | 订单号 `ORD{timestamp}{random4}` |
| `openid` | string | 下单用户 openid（权限规则依此校验） |
| `items` | array | 商品列表 `[{ id, name, price, quantity, specs }]` |
| `totalPrice` | number | 订单总额（元） |
| `type` | string | `dine-in`（堂食）/ `pickup`（自取） |
| `tableNo` | string | 桌号（仅堂食） |
| `pickupTime` | string | 取餐时间（仅自取） |
| `status` | string | 订单状态（见状态机） |
| `payStatus` | string | `paid` / `unpaid` / `refunded` |
| `createTime` | date | 创建时间 |
| `updateTime` | date | 更新时间 |
| `payTime` | date | 支付时间 |

**权限规则**：`openid == auth.openid`（用户仅能读自己的订单）

### `goods` — 商品

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 商品 ID |
| `name` | string | 商品名 |
| `price` | number | 售价（元） |
| `categoryId` | string | 分类 ID |
| `image` | string | 商品图片 fileID |
| `description` | string | 描述 |
| `status` | string | `on`（上架）/ `off`（下架） |
| `isRecommend` | boolean | 是否推荐 |
| `specs` | array | 规格选项 `[{ name, options }]` |
| `dailySales` | number | 日销量（`resetDailySales` 定时重置） |

**权限规则**：所有人可读，仅管理员可写

### `categories` — 分类

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 分类 ID |
| `name` | string | 分类名 |
| `sort` | number | 排序权重 |

**权限规则**：所有人可读，仅管理员可写

### `coupons` — 优惠券

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 优惠券 ID |
| `name` | string | 优惠券名 |
| `type` | string | 类型（满减/折扣/兑换） |
| `value` | number | 优惠金额或折扣率 |
| `minAmount` | number | 满减门槛 |
| `stock` | number | 剩余数量 |
| `total` | number | 总发行量 |
| `startTime` | date | 生效时间 |
| `endTime` | date | 失效时间 |
| `status` | string | `active` / `inactive` |

**权限规则**：所有人可读，仅管理员可写

### `couponGoods` — 优惠券关联商品

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 关联 ID |
| `couponId` | string | 优惠券 ID |
| `goodsId` | string | 商品 ID |

**权限规则**：所有人可读，仅管理员可写

### `tableCodes` — 桌码

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 桌码 ID |
| `tableNo` | string | 桌号 |
| `code` | string | 唯一码（二维码内容） |
| `createTime` | date | 创建时间 |

**权限规则**：所有人可读，仅管理员可写

### `settings` — 店铺配置

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 固定 `store_config` |
| `name` | string | 店铺名 |
| `status` | string | 营业状态 |
| `notice` | string | 公告 |
| `phone` | string | 联系电话 |
| `openTime` | string | 营业开始时间 |
| `closeTime` | string | 营业结束时间 |

**权限规则**：仅创建者可读写（前端不直读，通过 `loginAdmin` 的 `getStore` action 读取）

### `admins` — 管理员

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 管理员 ID |
| `username` | string | 账号 |
| `password` | string | 密码（**必须加盐哈希**） |
| `wechatId` | string | 微信号（扫码登录用） |
| `role` | string | 角色（`admin`） |
| `createTime` | date | 创建时间 |

**权限规则**：仅创建者可读写，禁止前端直读

## 🔄 订单状态机

```
                  createOrder
                       │
                       ▼
                   ┌────────┐
                   │ making │ (待支付)
                   └────┬───┘
                        │ createPayment + 用户支付
                        ▼
                   ┌──────────┐
        ┌─────────▶│ preparing│ (已支付/备餐中)
        │          └────┬─────┘
        │               │ updateOrderStatus
        │               ▼
        │          ┌──────────┐
        │          │completed │ (已完成)
        │          └──────────┘
        │
        │ cancelAndRefund
        ▼
   ┌──────────┐
   │cancelled │ (已取消/已退款)
   └──────────┘
```

| 状态 | 名称 | 触发动作 |
|---|---|---|
| `making` | 制作中 | `createOrder` 创建订单 |
| `pending` | 待支付 | `createPayment` 校验前置状态 |
| `preparing` | 已支付/备餐中 | `payCallback` 收到支付成功回调 |
| `completed` | 已完成 | `updateOrderStatus` 商家确认出餐 |
| `cancelled` | 已取消 | `cancelAndRefund` 取消并退款 |

## 💰 支付流程

```
小程序端                createPayment          微信支付平台            payCallback
   │                       │                      │                      │
   │ 1. 选商品下单          │                      │                      │
   │ ─────────────────▶    │                      │                      │
   │                       │ 2. 查订单             │                      │
   │                       │   校验 status         │                      │
   │ 3. createPayment      │                      │                      │
   │ ─────────────────▶    │                      │                      │
   │                       │ 4. cloudPay          │                      │
   │                       │   .unifiedOrder      │                      │
   │                       │ ──────────────────▶  │                      │
   │                       │ 5. 返回 payment       │                      │
   │ ◀─────────────────    │                      │                      │
   │ 6. wx.requestPayment  │                      │                      │
   │   (拉起支付)           │                      │                      │
   │ ──────────────────────────────────────────▶  │                      │
   │                       │                      │ 7. 支付成功           │
   │                       │                      │ ──────────────────▶  │
   │                       │                      │                      │ 8. 校验签名
   │                       │                      │                      │    更新 status
   │                       │                      │                      │    = preparing
   │                       │                      │                      │    payStatus = paid
```

**安全要点**：
- 第 4 步 `totalFee` 必须从 `orders` 集合读取，**禁止使用前端传入金额**
- 第 8 步 `payCallback` 必须做幂等处理（重复回调不重复更新）
- 退款走 `cancelAndRefund`，调用 `cloud.cloudPay.refund`

## ☁️ 云函数清单

| 云函数 | 入参 | 职责 | 鉴权 |
|---|---|---|---|
| `createOrder` | `items, totalPrice, type, tableNo, pickupTime` | 创建订单，生成订单号 | 用户 openid |
| `createPayment` | `orderId` | 创建微信支付，返回支付参数 | 用户 openid |
| `payCallback` | `resultCode, outTradeNo, attach` | 支付回调，更新订单状态 | 微信支付平台 |
| `cancelAndRefund` | `orderId` | 取消订单并退款 | 用户/管理员 |
| `updateOrderStatus` | `orderId, status` | 更新订单状态 | 管理员 |
| `getAdminOrders` | `status, page` | 管理端订单查询 | 管理员 |
| `couponManager` | `action, ...` | 优惠券 CRUD 与核销 | 管理员 |
| `generateTableCode` | `count, prefix` | 批量生成桌码 | 管理员 |
| `loginAdmin` | `action, ...` | 管理员登录/注册/店铺配置 | 多 action 混合 |
| `resetDailySales` | — | 定时重置 `dailySales` 字段 | 定时触发器 |

## 🔗 相关文档

- [README.md](../README.md) — 项目说明
- [SECURITY.md](../SECURITY.md) — 安全策略与部署清单
- [CONTRIBUTING.md](../CONTRIBUTING.md) — 贡献指南
- [CHANGELOG.md](../CHANGELOG.md) — 变更日志
