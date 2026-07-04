# William厨房 - 微信小程序点餐系统

基于微信云开发的全栈点餐解决方案，包含小程序端（C端——用户点餐）和管理后台（B端——商家运营）。

## 项目架构

```
├── miniprogram/          # 微信小程序端（用户侧）
│   ├── pages/            # 页面目录
│   │   ├── index/        # 首页
│   │   ├── menu/         # 点餐菜单
│   │   ├── cart/         # 购物车
│   │   ├── orders/       # 订单列表
│   │   ├── orderDetail/  # 订单详情
│   │   ├── payment/      # 支付页面
│   │   ├── coupons/      # 优惠券列表
│   │   ├── couponSelect/ # 优惠券选择
│   │   └── mine/         # 个人中心
│   ├── images/           # 图标资源
│   ├── utils/            # 工具函数
│   ├── app.js            # 入口文件（云开发初始化 + 全局状态）
│   ├── app.json          # 全局配置
│   └── app.wxss          # 全局样式
│
├── admin/                # 管理后台（商家侧）
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   │   ├── Login.vue       # 登录
│   │   │   ├── Register.vue    # 注册
│   │   │   ├── Confirm.vue     # 登录确认
│   │   │   ├── Dashboard.vue   # 数据看板
│   │   │   ├── Orders.vue      # 订单管理
│   │   │   ├── Goods.vue       # 商品管理
│   │   │   ├── Coupons.vue     # 优惠券管理
│   │   │   ├── TableCodes.vue  # 桌码管理
│   │   │   └── Settings.vue    # 店铺设置
│   │   ├── layout/       # 布局组件
│   │   ├── api/          # 云开发接口封装
│   │   └── router/       # 路由配置 + 鉴权守卫
│   └── vite.config.js    # Vite 构建配置
│
├── cloudfunctions/       # 云函数
│   ├── createOrder/      # 创建订单
│   ├── createPayment/    # 创建支付
│   ├── payCallback/      # 支付回调
│   ├── cancelAndRefund/  # 取消退款
│   ├── updateOrderStatus/# 更新订单状态
│   ├── getAdminOrders/   # 获取管理端订单
│   ├── couponManager/    # 优惠券管理
│   ├── generateTableCode/# 生成桌码
│   ├── loginAdmin/       # 管理员登录
│   └── resetDailySales/  # 重置日销量
│
└── project.config.json   # 小程序项目配置
```

## 技术栈

| 模块 | 技术 |
|------|------|
| 小程序端 | 微信小程序原生框架 (WXML/WXSS/JS) |
| 管理后台 | Vue 3 + Vue Router 4 |
| 构建工具 | Vite 5 |
| 云服务 | 微信云开发（云函数 + 云数据库 + 云存储） |
| 后端SDK | wx-server-sdk / @cloudbase/js-sdk |
| 其他 | qrcode（桌码生成） |

## 功能概览

### 小程序端

- **扫码点餐**：堂食扫码绑定桌号 / 外卖模式切换
- **菜单浏览**：分类筛选、商品搜索、规格选择
- **购物车**：增删改查、本地持久化（StorageSync）
- **微信支付**：下单支付、支付回调处理
- **订单管理**：订单列表、订单详情、状态追踪
- **优惠券**：领券中心、下单选券、自动核销

### 管理后台

- **数据看板**：实时订单统计、销售数据
- **订单管理**：接单/制作/完成 状态流转、退款处理
- **商品管理**：分类管理、商品 CRUD、上下架、推荐
- **优惠券管理**：创建/编辑/删除、关联商品
- **桌码管理**：批量生成桌码二维码
- **店铺设置**：店铺信息配置

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新稳定版
- Node.js 16+
- 已开通微信云开发的微信小程序账号

### 小程序端

1. 克隆项目并导入微信开发者工具：

```bash
git clone https://github.com/WorthChecking/WeChat-Miniprogram.git
```

2. 在微信开发者工具中选择「导入项目」，目录选择项目根目录
3. 填入 AppID，确认 `project.config.json` 中 `appid` 字段正确
4. 开通云开发，记录云环境 ID
5. 在 `miniprogram/app.js` 中替换云环境 ID：

```javascript
this.globalData = {
  env: "你的云环境ID",
  // ...
};
```

6. 右键 `cloudfunctions` 目录，选择「上传并部署：云端安装依赖」

### 管理后台

1. 安装依赖并启动开发服务器：

```bash
cd admin
npm install
npm run dev
```

2. 浏览器访问 `http://localhost:3000`
3. 修改 `admin/src/api/cloud.js` 中的 `ENV_ID` 为你的云环境 ID：

```javascript
const ENV_ID = '你的云环境ID'
```

4. 构建生产版本：

```bash
npm run build
```

### 云数据库集合

需在云开发控制台创建以下集合：

| 集合名 | 说明 |
|--------|------|
| `goods` | 商品数据 |
| `categories` | 分类数据 |
| `orders` | 订单数据 |
| `coupons` | 优惠券数据 |
| `couponGoods` | 优惠券关联商品 |
| `tableCodes` | 桌码数据 |
| `settings` | 店铺配置 |
| `admins` | 管理员账户 |

## 许可证

MIT
