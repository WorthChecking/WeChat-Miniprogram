# 变更日志

本项目所有重要变更记录于此文件。版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### 计划中

- 数据看板新增时段销售曲线与爆款榜
- 优惠券支持满减 / 折扣 / 兑换券多类型
- 桌码支持扫码预览与批量打印模板

## [1.0.0] - 2026-07-04

### 首次发布

基于微信云开发的全栈点餐解决方案，包含小程序端（C 端）、管理后台（B 端）与 10 个云函数。

#### 新增 - 小程序端

- 堂食扫码绑定桌号 / 外卖模式切换
- 菜单浏览：分类筛选、商品搜索、规格选择
- 购物车：增删改查、本地持久化（StorageSync）
- 微信支付：下单支付、支付回调处理
- 订单管理：订单列表、订单详情、状态追踪
- 优惠券：领券中心、下单选券、自动核销

#### 新增 - 管理后台

- Vue 3 + Vite 5 + Vue Router 4 构建的 SPA
- 数据看板：实时订单统计、销售数据
- 订单管理：接单 / 制作 / 完成 状态流转、退款处理
- 商品管理：分类管理、商品 CRUD、上下架、推荐
- 优惠券管理：创建 / 编辑 / 删除、关联商品
- 桌码管理：批量生成桌码二维码
- 店铺设置：店铺信息配置

#### 新增 - 云函数

- `createOrder`：创建订单（金额服务端计算）
- `createPayment`：创建微信支付
- `payCallback`：支付回调（签名校验 + 幂等）
- `cancelAndRefund`：取消订单与退款
- `updateOrderStatus`：订单状态流转
- `getAdminOrders`：管理端订单查询（鉴权）
- `couponManager`：优惠券 CRUD 与核销
- `generateTableCode`：桌码批量生成（鉴权）
- `loginAdmin`：管理员登录鉴权
- `resetDailySales`：日销量定时重置

#### 基础设施

- `.gitignore` 覆盖 `node_modules`、`admin/dist`、`project.private.config.json`、`database_export-*.json`、日志与系统文件
- `project.config.json` 配置微信开发者工具
- `LICENSE`（MIT）与基础 `README.md`

[Unreleased]: https://github.com/WorthChecking/WeChat-Miniprogram/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/WorthChecking/WeChat-Miniprogram/releases/tag/v1.0.0
