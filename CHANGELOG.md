# 变更日志

本项目所有重要变更记录于此文件。版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### 计划中

- 数据看板新增时段销售曲线与爆款榜
- 优惠券支持满减 / 折扣 / 兑换券多类型
- 桌码支持扫码预览与批量打印模板

## [1.1.0] - 2026-07-06

### 安全修复

- **删除 `loginAdmin` 硬编码 `admin/123456` 后门**：超级管理员改为通过 `initAdmin` action 一次性初始化创建（`admins` 集合为空时生效），密码 scrypt 加盐哈希存储
- **密码改用 scrypt 加盐哈希**：格式 `scrypt:{salt}:{hash}`，历史明文密码在首次登录时自动升级
- **新增 `adminSessions` 集合与会话 token 鉴权**：`login` 成功后生成 32 字节随机 token（7 天有效期），前端 `callFunction` 统一注入，云函数端 `verifyAdminToken` 校验
- **`loginAdmin` 所有写操作加鉴权**：`register`/`uploadImage`/`updateGoodsStatus`/`toggleRecommend`/`updateStore`/`updateDoc`/`changePassword` 需有效 token
- **`updateDoc` 限制 collection 白名单**：仅允许 `categories`/`goods`/`settings`/`coupons`，杜绝越权改任意集合
- **`updateOrderStatus`/`getAdminOrders`/`generateTableCode` 加管理员 token 鉴权**
- **`cancelAndRefund` 区分管理员（token）与用户（openid）**：用户仅能取消自己的订单，管理员可取消任意订单
- **`couponManager` 写操作加 token 鉴权**：`createCoupon`/`updateCoupon`/`deleteCoupon`/`setCouponGoods`/`getCoupons` 需 token；`getUserCoupons`/`grantCoupon`/`checkCouponUsable`/`getCouponGoods` 保持 openid 鉴权
- **`resetDailySales` 放行定时触发器，外部调用需 token**
- **修复 `couponManager` 缺失 `setCouponGoods`/`getCouponGoods` action 的既有 bug**

### 改进 - 前端

- `admin/src/api/cloud.js` 的 `callFunction` 统一注入 token，返回 `unauthorized` 时自动清除凭据并跳转登录页
- `Login.vue` 保存后端返回的真 token（替代伪造的 `admin_时间戳`）
- `Register.vue` 提示「需已登录管理员授权」，未登录时阻止提交
- 路由守卫允许已登录管理员访问注册页（用于创建新管理员）

### 文档

- 新增 [docs/architecture.md](docs/architecture.md) 管理端鉴权流程章节、`adminSessions` 集合结构、`initAdmin` 首次部署说明
- `README.md` 快速开始新增第 6 步「初始化管理员账号」、安全红线表格更新

### ⚠️ 升级指南

1. 部署所有云函数（右键 `cloudfunctions` → 上传并部署：云端安装依赖）
2. 在云开发控制台创建 `adminSessions` 集合，权限规则设为「仅创建者可读写」
3. 调用 `loginAdmin` 的 `initAdmin` action 初始化首个管理员（若 `admins` 集合已有明文密码账号，登录时会自动升级为哈希）
4. 重新构建管理后台 `cd admin && npm run build` 并部署

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

[Unreleased]: https://github.com/WorthChecking/WeChat-Miniprogram/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/WorthChecking/WeChat-Miniprogram/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/WorthChecking/WeChat-Miniprogram/releases/tag/v1.0.0
