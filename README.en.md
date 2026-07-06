<div align="center">

# William's Kitchen

### WeChat Mini-Program Ordering System

A full-stack ordering solution built on WeChat Cloud Development, comprising a mini-program client (C-side — customer ordering) and an admin dashboard (B-side — merchant operations). The backend is 10 cloud functions covering orders, payments, and refunds. Zero server ops — cloud-native architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-WeChat%20Miniprogram-07c160.svg)](https://developers.weixin.qq.com/miniprogram/)
[![Frontend](https://img.shields.io/badge/Frontend-Vue%203%20%2B%20Vite%205-42b883.svg)](https://vuejs.org/)
[![Backend](https://img.shields.io/badge/Backend-Cloud%20Functions-ff9900.svg)](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red.svg)]()

</div>

---

## 📖 About

William's Kitchen is a WeChat ordering system for small-to-mid restaurants, covering the full loop: place order → pay → serve → coupon redemption. Customers scan to order and pay via WeChat Pay; merchants handle orders, products, and coupons via a Vue admin dashboard. The whole stack runs on WeChat Cloud Development — no self-hosted servers.

### Core Capabilities

- 🍜 **Dual-mode ordering**: dine-in scan binds table number / takeout self-pickup toggle
- 🛒 **Shopping cart**: full CRUD, spec selection, local persistence (StorageSync)
- 💰 **WeChat Pay**: cloudPay unified order + payment callback + refund
- 🎫 **Coupons**: coupon center, selection at checkout, auto redemption, product association
- 📊 **Admin dashboard**: data dashboard, order state machine, product CRUD, batch table code generation
- ☁️ **Cloud-native**: cloud functions + cloud database + cloud storage, zero server ops

## 🎬 Feature Overview

> 📌 Customer-side tabs and admin dashboard pages:
>
> | Side | Page | Function |
> |---|---|---|
> | Customer | Home | store info, featured products, business status |
> | Customer | Order | category filter, product search, spec selection, add to cart |
> | Customer | Orders | order list, status tracking, order detail |
> | Customer | Profile | personal center, coupons, history |
> | Customer | Payment | WeChat Pay invocation, payment result callback |
> | Admin | Dashboard | real-time order stats, sales data |
> | Admin | Orders | accept / cooking / done state machine, refunds |
> | Admin | Products | categories, CRUD, on/off shelf, featured |
> | Admin | Coupons | create / edit / delete, product association |
> | Admin | Table codes | batch QR code generation |

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Mini-program | WeChat native (WXML/WXSS/JS) | 9 pages, tabBar navigation |
| Admin dashboard | Vue 3 + Vue Router 4 | SPA, route-guard auth |
| Build tool | Vite 5 | admin build |
| Cloud functions | Node.js + wx-server-sdk | 10 functions covering core business |
| Cloud database | WeChat CloudBase DB | 8 collections, permission rules |
| Cloud pay | cloudPay.cloudPay.unifiedOrder | JSAPI, callback-driven |
| Other | qrcode | table code QR generation |

## 📦 Project Structure

```
WeChat-Miniprogram/
├── miniprogram/              # mini-program (customer side)
│   ├── pages/                # 9 pages (home/menu/cart/orders/detail/payment/coupons/select/profile)
│   ├── images/               # icon assets
│   ├── utils/                # utilities
│   ├── app.js                # entry (cloud init + global state)
│   ├── app.json              # global config (routes, tabBar, window)
│   └── app.wxss              # global styles
│
├── admin/                    # admin dashboard (merchant side)
│   ├── src/
│   │   ├── views/            # 9 views (login/register/confirm/dashboard/orders/goods/coupons/table-codes/settings)
│   │   ├── layout/           # layout components
│   │   ├── api/              # cloud API wrapper (cloud.js)
│   │   ├── router/           # routing + auth guards
│   │   └── styles/           # global styles
│   └── vite.config.js        # Vite build config
│
├── cloudfunctions/           # 10 cloud functions
│   ├── createOrder/          # create order (server-side amount)
│   ├── createPayment/        # create WeChat Pay
│   ├── payCallback/          # payment callback (state transition)
│   ├── cancelAndRefund/      # cancel & refund
│   ├── updateOrderStatus/    # order status update
│   ├── getAdminOrders/       # admin order query (auth)
│   ├── couponManager/        # coupon CRUD & redemption
│   ├── generateTableCode/    # batch table code generation
│   ├── loginAdmin/           # admin login & store config
│   └── resetDailySales/      # daily sales reset
│
├── docs/                     # technical docs
│   └── architecture.md       # architecture & database design
├── .github/                  # GitHub community files (Issue/PR templates, CI)
├── CONTRIBUTING.md           # contribution guide
├── SECURITY.md               # security policy
├── CHANGELOG.md              # changelog
├── LICENSE                   # MIT License
├── README.md                 # project readme (Chinese)
└── README.en.md              # project readme (English)
```

## 🚀 Quick Start

### Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| WeChat DevTools | latest stable | mini-program dev & preview |
| Node.js | 16+ | admin build |
| WeChat CloudBase | enabled | mini-program account with Cloud Dev enabled |

### 1️⃣ Clone

```bash
git clone https://github.com/WorthChecking/WeChat-Miniprogram.git
cd WeChat-Miniprogram
```

### 2️⃣ Mini-program

1. In WeChat DevTools, choose "Import Project", select the repo root.
2. Enter your AppID (from the [WeChat MP platform](https://mp.weixin.qq.com/)).
3. Enable Cloud Development and note your cloud env ID.
4. Fill in the env ID in [`miniprogram/app.js`](miniprogram/app.js):

```javascript
this.globalData = {
  env: "YOUR_ENV_ID",
  // ...
};
```

5. Right-click the `cloudfunctions` directory → "Upload and Deploy: Install Dependencies in the Cloud".

### 3️⃣ Admin Dashboard

#### Local development

```bash
cd admin
npm install
npm run dev
```

Open `http://localhost:3000` for local debugging, and fill in your cloud env ID in [`admin/src/api/cloud.js`](admin/src/api/cloud.js):

```javascript
const ENV_ID = 'YOUR_ENV_ID'
```

#### Production deployment

```bash
npm run build
```

Deploy `admin/dist/` to your own server or static hosting (WeChat CloudBase static hosting, Vercel, Netlify, Nginx, etc.), accessible via your registered domain with HTTPS. Ensure the cloud env ID, database permission rules, and cloud function auth match the [security checklist](#-security-red-lines).

### 4️⃣ Cloud Database Collections

Create these collections in the CloudBase console (permission rules in [Security Red Lines](#-security-red-lines)):

| Collection | Description |
|---|---|
| `goods` | products |
| `categories` | categories |
| `orders` | orders |
| `coupons` | coupons |
| `couponGoods` | coupon-product associations |
| `tableCodes` | table codes |
| `settings` | store config |
| `admins` | admin accounts |

## 🛡️ Security Red Lines

This project involves WeChat Pay and user orders. Before deployment, you **must** complete the following — otherwise privilege-escalation and payment risks exist (full details in [SECURITY.md](SECURITY.md)):

| Red line | Content |
|---|---|
| **DB permissions** | `admins`/`settings`: creator-only; `orders`: `openid == auth.openid`; others: world-readable, admin-write-only |
| **Payment integrity** | `createPayment` amounts must be computed server-side from the `goods` collection — **never trust client amounts**; `payCallback` must verify WeChat signatures and be idempotent |
| **Function auth** | `getAdminOrders`/`couponManager`/`generateTableCode`/`loginAdmin`/`resetDailySales` must verify the caller is a valid admin inside the function — **never rely on hidden UI** |
| **Credential management** | AppSecret lives only in cloud function env vars or the mini-program backend — **never in frontend code or git**; cloud env ID is replaced with `YOUR_ENV_ID` placeholder |
| **Password storage** | passwords in `admins` must be salted-hashed — never plaintext |

## 📚 Documentation

| Doc | Description |
|---|---|
| [Architecture & Database Design](docs/architecture.md) | architecture diagram, collection schemas, order state machine, payment flow |
| [Security Policy](SECURITY.md) | vulnerability reporting + deployment checklist |
| [Contributing Guide](CONTRIBUTING.md) | dev environment, code standards, commit conventions, PR flow |
| [Changelog](CHANGELOG.md) | version history (Keep a Changelog format) |
| [中文 README](README.md) | Chinese project readme |

## 📌 Next Steps

After deployment, proceed with:

1. **CI checks**: On the next push or PR, [`.github/workflows/ci.yml`](.github/workflows/ci.yml) automatically runs the admin build and cloud function syntax checks — see the **Actions** tab.
2. **Release**: [CHANGELOG.md](CHANGELOG.md) records v1.0.0; tag it `v1.0.0` on the [Releases](https://github.com/WorthChecking/WeChat-Miniprogram/releases) page.
3. **Fill in env ID & AppID**: Replace `YOUR_ENV_ID` in [`miniprogram/app.js`](miniprogram/app.js) and [`admin/src/api/cloud.js`](admin/src/api/cloud.js) with your own cloud env ID; replace `appid` in `project.config.json` with your own AppID.
4. **Upload cloud functions**: In WeChat DevTools, right-click the `cloudfunctions` directory → "Upload and Deploy: Install Dependencies in the Cloud".
5. **Verify auth**: Audit database permission rules and cloud function auth per [SECURITY.md](SECURITY.md) to avoid privilege escalation and payment risks.

## 🗺️ Roadmap

- [x] Dine-in scan / takeout self-pickup dual-mode ordering
- [x] Shopping cart with local persistence
- [x] Full WeChat Pay chain (order → pay → callback → refund)
- [x] Coupon claim / select / redeem
- [x] Admin order state machine & product management
- [x] Batch table code generation
- [ ] Dashboard: time-of-day sales curve + best-seller list
- [ ] Coupons: fixed-discount / percentage / exchange types
- [ ] Table code: scan preview + batch print templates
- [ ] Multi-store / multi-branch support
- [ ] Order receipt printing

## 🤝 Contributing

Contributions, issues, and suggestions welcome! Please read the [Contributing Guide](CONTRIBUTING.md) first.

- 🐛 Report a bug: [open an Issue](https://github.com/WorthChecking/WeChat-Miniprogram/issues/new?template=bug_report.yml)
- 💡 Suggest a feature: [open an Issue](https://github.com/WorthChecking/WeChat-Miniprogram/issues/new?template=feature_request.yml)
- 🔧 Contribute code: Fork → feature branch → Pull Request

For security vulnerabilities, **do not** open a public issue — report privately per [SECURITY.md](SECURITY.md).

## 📄 License

Released under the [MIT License](LICENSE), © 2026 WorthChecking.

## ⭐ Star History

If this project helps you, a Star is appreciated!

<div align="center">

**[⬆ Back to top](#williams-kitchen)**

</div>
