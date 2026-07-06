<div align="center">

# William 厨房

### 微信小程序点餐系统

基于微信云开发的全栈点餐解决方案，涵盖小程序端（C 端——用户点餐）与管理后台（B 端——商家运营），后端为 10 个云函数覆盖订单、支付、退款等核心业务。零服务器运维，云原生架构。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-WeChat%20Miniprogram-07c160.svg)](https://developers.weixin.qq.com/miniprogram/)
[![Frontend](https://img.shields.io/badge/Frontend-Vue%203%20%2B%20Vite%205-42b883.svg)](https://vuejs.org/)
[![Backend](https://img.shields.io/badge/Backend-Cloud%20Functions-ff9900.svg)](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red.svg)]()

</div>

---

## 📖 项目简介

William 厨房是一套面向中小餐饮商家的微信点餐系统，覆盖「点单 → 支付 → 出餐 → 核销」完整闭环。顾客通过小程序扫码点餐并微信支付，商家通过 Vue 管理后台处理订单、管理商品与优惠券。整套系统跑在微信云开发上，无需自建服务器。

### 核心能力

- 🍜 **双模式点餐**：堂食扫码绑定桌号 / 外卖自取模式切换
- 🛒 **购物车**：增删改查、规格选择、本地持久化（StorageSync）
- 💰 **微信支付**：云开发 cloudPay 统一下单 + 支付回调 + 退款
- 🎫 **优惠券**：领券中心、下单选券、自动核销、关联商品校验
- 📊 **管理后台**：数据看板、订单流转、商品 CRUD、桌码批量生成
- ☁️ **云原生**：云函数 + 云数据库 + 云存储，零服务器运维

## 🎬 功能概览

> 📌 顾客端四 Tab 与商家后台核心页面：
>
> | 端 | 页面 | 功能 |
> |---|---|---|
> | 顾客端 | 首页 | 店铺信息、推荐商品、营业状态 |
> | 顾客端 | 点餐 | 分类筛选、商品搜索、规格选择、加入购物车 |
> | 顾客端 | 订单 | 订单列表、状态追踪、订单详情 |
> | 顾客端 | 我的 | 个人中心、优惠券、历史订单 |
> | 顾客端 | 支付 | 微信支付拉起、支付结果回调 |
> | 商家后台 | 数据看板 | 实时订单统计、销售数据 |
> | 商家后台 | 订单管理 | 接单 / 制作 / 完成 状态流转、退款处理 |
> | 商家后台 | 商品管理 | 分类管理、商品 CRUD、上下架、推荐 |
> | 商家后台 | 优惠券管理 | 创建 / 编辑 / 删除、关联商品 |
> | 商家后台 | 桌码管理 | 批量生成桌码二维码 |

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 小程序端 | 微信原生框架 (WXML/WXSS/JS) | 9 个页面，tabBar 导航 |
| 管理后台 | Vue 3 + Vue Router 4 | SPA，路由守卫鉴权 |
| 构建工具 | Vite 5 | 管理后台构建 |
| 云函数 | Node.js + wx-server-sdk | 10 个云函数覆盖核心业务 |
| 云数据库 | 微信云开发数据库 | 8 个集合，权限规则控制 |
| 云支付 | cloudPay.cloudPay.unifiedOrder | JSAPI 支付，回调驱动 |
| 其他 | qrcode | 桌码二维码生成 |

## 📦 项目结构

```
WeChat-Miniprogram/
├── miniprogram/              # 微信小程序端（顾客侧）
│   ├── pages/                # 9 个页面（首页/点餐/购物车/订单/详情/支付/优惠券/选券/我的）
│   ├── images/               # 图标资源
│   ├── utils/                # 工具函数
│   ├── app.js                # 入口（云开发初始化 + 全局状态）
│   ├── app.json              # 全局配置（路由、tabBar、窗口）
│   └── app.wxss              # 全局样式
│
├── admin/                    # 管理后台（商家侧）
│   ├── src/
│   │   ├── views/            # 9 个视图（登录/注册/确认/看板/订单/商品/优惠券/桌码/设置）
│   │   ├── layout/           # 布局组件
│   │   ├── api/              # 云开发接口封装（cloud.js）
│   │   ├── router/           # 路由配置 + 鉴权守卫
│   │   └── styles/           # 全局样式
│   └── vite.config.js        # Vite 构建配置
│
├── cloudfunctions/           # 10 个云函数
│   ├── createOrder/          # 创建订单（金额服务端计算）
│   ├── createPayment/        # 创建微信支付
│   ├── payCallback/          # 支付回调（状态流转）
│   ├── cancelAndRefund/      # 取消订单与退款
│   ├── updateOrderStatus/    # 订单状态更新
│   ├── getAdminOrders/       # 管理端订单查询（鉴权）
│   ├── couponManager/        # 优惠券 CRUD 与核销
│   ├── generateTableCode/    # 桌码批量生成
│   ├── loginAdmin/           # 管理员登录与店铺配置
│   └── resetDailySales/      # 日销量定时重置
│
├── docs/                     # 技术文档
│   └── architecture.md       # 架构与数据库设计
├── .github/                  # GitHub 社区文件（Issue/PR 模板、CI）
├── CONTRIBUTING.md           # 贡献指南
├── SECURITY.md               # 安全策略
├── CHANGELOG.md              # 变更日志
├── LICENSE                   # MIT License
├── README.md                 # 项目说明（中文）
└── README.en.md              # 项目说明（英文）
```

## 🚀 快速开始

### 前置条件

| 依赖 | 版本 | 说明 |
|---|---|---|
| 微信开发者工具 | 最新稳定版 | 小程序端开发与预览 |
| Node.js | 16+ | 管理后台构建 |
| 微信云开发 | 已开通 | 需小程序账号已开通云开发 |

### 1️⃣ 克隆仓库

```bash
git clone https://github.com/WorthChecking/WeChat-Miniprogram.git
cd WeChat-Miniprogram
```

### 2️⃣ 小程序端

1. 在微信开发者工具中选择「导入项目」，目录选择项目根目录
2. 填入您的 AppID（在 [微信公众平台](https://mp.weixin.qq.com/) 获取）
3. 开通云开发，记录您的云环境 ID（在云开发控制台获取）
4. 在 [`miniprogram/app.js`](miniprogram/app.js) 中填入云环境 ID：

```javascript
this.globalData = {
  env: "YOUR_ENV_ID",
  // ...
};
```

5. 右键 `cloudfunctions` 目录 →「上传并部署：云端安装依赖」
6. **初始化管理员账号**（首次部署必做）：在微信开发者工具 → 云开发控制台 → 云函数 → `loginAdmin` → 测试，传入以下参数创建首个管理员：

```json
{ "action": "initAdmin", "username": "yourAdmin", "password": "你的强密码" }
```

> 该 action 仅在 `admins` 集合为空时生效，创建成功后永久拒绝。密码使用 scrypt 加盐哈希存储。详见 [技术架构 - 管理端鉴权流程](docs/architecture.md#-管理端鉴权流程)。

### 3️⃣ 管理后台

#### 本地开发

```bash
cd admin
npm install
npm run dev
```

本地调试访问 `http://localhost:3000`，并在 [`admin/src/api/cloud.js`](admin/src/api/cloud.js) 中填入您的云环境 ID：

```javascript
const ENV_ID = 'YOUR_ENV_ID'
```

#### 生产部署

```bash
npm run build
```

将 `admin/dist/` 部署到您自己的服务器或静态托管（微信云开发静态网站托管、Vercel、Netlify、Nginx 等），通过您注册的域名访问，生产环境必须配置 HTTPS。确保云环境 ID、数据库权限规则与云函数鉴权与 [部署安全清单](#-安全红线) 一致。

### 4️⃣ 云数据库集合

在云开发控制台创建以下集合（权限规则见 [安全红线](#-安全红线)）：

| 集合 | 说明 |
|---|---|
| `goods` | 商品数据 |
| `categories` | 分类数据 |
| `orders` | 订单数据 |
| `coupons` | 优惠券数据 |
| `couponGoods` | 优惠券关联商品 |
| `tableCodes` | 桌码数据 |
| `settings` | 店铺配置 |
| `admins` | 管理员账户 |

## 🛡️ 安全红线

本项目涉及微信支付与用户订单，部署前**必须**完成以下配置，否则存在越权与支付风险（完整说明见 [SECURITY.md](SECURITY.md)）：

| 红线 | 内容 |
|---|---|
| **数据库权限** | `admins`/`settings` 仅创建者可读写；`orders` 限 `openid == auth.openid`；其余集合所有人可读、仅管理员可写 |
| **支付校验** | `createPayment` 金额必须由服务端从 `goods` 集合实时计算，**禁止信任前端传入金额**；`payCallback` 必须校验微信签名并做幂等 |
| **云函数鉴权** | 所有写操作云函数（`updateOrderStatus`/`getAdminOrders`/`cancelAndRefund` 管理员侧/`couponManager` 写操作/`generateTableCode`/`loginAdmin` 写操作/`resetDailySales` 外部调用）均通过 `adminSessions` 集合校验 token，**不得依赖前端隐藏入口** |
| **凭据管理** | AppSecret 仅放在云函数环境变量或小程序后台，**绝不可出现在前端代码或 git 仓库**；云环境 ID 已替换为 `YOUR_ENV_ID` 占位符 |
| **密码存储** | `admins` 集合的密码使用 scrypt 加盐哈希（格式 `scrypt:{salt}:{hash}`），历史明文密码在首次登录时自动升级 |

## 📚 文档导航

| 文档 | 说明 |
|---|---|
| [技术架构与数据库设计](docs/architecture.md) | 架构图、集合字段结构、订单状态机、支付流程 |
| [安全策略](SECURITY.md) | 漏洞报告方式 + 部署安全清单 |
| [贡献指南](CONTRIBUTING.md) | 开发环境、代码规范、提交规范、PR 流程 |
| [变更日志](CHANGELOG.md) | 版本记录（Keep a Changelog 格式） |
| [English README](README.en.md) | 英文版项目说明 |

## 📌 后续步骤

部署完成后建议按以下步骤推进：

1. **CI 自动检查**：下次 push 或提交 PR 时，[`.github/workflows/ci.yml`](.github/workflows/ci.yml) 会自动运行管理后台构建与云函数语法检查，结果在仓库 **Actions** 页面查看。
2. **发布 Release**：[CHANGELOG.md](CHANGELOG.md) 已记录 v1.0.0，可在 [Releases](https://github.com/WorthChecking/WeChat-Miniprogram/releases) 页面打 `v1.0.0` tag 对应版本。
3. **填入云环境 ID 与 AppID**：部署前在 [`miniprogram/app.js`](miniprogram/app.js) 与 [`admin/src/api/cloud.js`](admin/src/api/cloud.js) 中将 `YOUR_ENV_ID` 替换为您自己的云环境 ID；`project.config.json` 中的 `appid` 替换为您自己的 AppID。
4. **上传云函数**：在微信开发者工具中右键 `cloudfunctions` 目录，选择「上传并部署：云端安装依赖」。
5. **验证鉴权**：按 [SECURITY.md](SECURITY.md) 的部署清单逐项核对数据库权限规则与云函数鉴权，避免越权与支付风险。

## 🗺️ Roadmap

- [x] 堂食扫码 / 外卖自取双模式点餐
- [x] 购物车与本地持久化
- [x] 微信支付全链路（下单 → 支付 → 回调 → 退款）
- [x] 优惠券领取 / 选择 / 核销
- [x] 管理后台订单流转与商品管理
- [x] 桌码批量生成
- [ ] 数据看板新增时段销售曲线与爆款榜
- [ ] 优惠券支持满减 / 折扣 / 兑换券多类型
- [ ] 桌码扫码预览与批量打印模板
- [ ] 多店铺 / 多门店支持
- [ ] 订单打印小票接入

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！请先阅读 [贡献指南](CONTRIBUTING.md)。

- 🐛 报告 Bug：[提交 Issue](https://github.com/WorthChecking/WeChat-Miniprogram/issues/new?template=bug_report.yml)
- 💡 功能建议：[提交 Issue](https://github.com/WorthChecking/WeChat-Miniprogram/issues/new?template=feature_request.yml)
- 🔧 贡献代码：Fork → 特性分支 → Pull Request

发现安全漏洞请**不要**开公开 Issue，按 [SECURITY.md](SECURITY.md) 私下报告。

## 📄 License

本项目基于 [MIT License](LICENSE) 开源，版权所有 © 2026 WorthChecking。

## ⭐ Star History

如果这个项目对你有帮助，欢迎 Star 支持！

<div align="center">

**[⬆ 回到顶部](#william-厨房)**

</div>
