[简体中文](README.md) | [**English**](README.en.md)

# William's Kitchen — WeChat Mini-Program Ordering System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-42b883.svg)](https://vuejs.org/)
[![Vite 5](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vitejs.dev/)
[![WeChat Miniprogram](https://img.shields.io/badge/WeChat-Miniprogram-07c160.svg)](https://developers.weixin.qq.com/miniprogram/)
[![CloudBase](https://img.shields.io/badge/CloudBase-ff9900.svg)](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/)

> A full-stack ordering solution built on WeChat Cloud Development, comprising a mini-program client (C-side — customer ordering) and an admin dashboard (B-side — merchant operations). The backend is 10 cloud functions covering the core business: orders, payments, and refunds. Zero server ops — cloud-native architecture.

**Status: v1.0.0 — production-ready.** The current release covers the complete ordering loop (place order → pay → serve → coupon redemption). See [CHANGELOG.md](CHANGELOG.md).

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Quick Start](#quick-start)
- [Cloud Database Collections](#cloud-database-collections)
- [Deployment Security Checklist](#deployment-security-checklist)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security Policy](#security-policy)
- [License](#license)

## Architecture

```
├── miniprogram/          # WeChat mini-program (customer side)
│   ├── pages/            # page directories
│   │   ├── index/        # home
│   │   ├── menu/         # ordering menu
│   │   ├── cart/         # shopping cart
│   │   ├── orders/       # order list
│   │   ├── orderDetail/  # order detail
│   │   ├── payment/      # payment
│   │   ├── coupons/      # coupon list
│   │   ├── couponSelect/ # coupon selection
│   │   └── mine/         # profile
│   ├── images/           # icon assets
│   ├── utils/            # utilities
│   ├── app.js            # entry (cloud init + global state)
│   ├── app.json          # global config
│   └── app.wxss          # global styles
│
├── admin/                # admin dashboard (merchant side)
│   ├── src/
│   │   ├── views/        # page components
│   │   │   ├── Login.vue       # login
│   │   │   ├── Register.vue    # register
│   │   │   ├── Confirm.vue     # login confirm
│   │   │   ├── Dashboard.vue   # data dashboard
│   │   │   ├── Orders.vue      # order management
│   │   │   ├── Goods.vue       # product management
│   │   │   ├── Coupons.vue     # coupon management
│   │   │   ├── TableCodes.vue  # table code management
│   │   │   └── Settings.vue    # store settings
│   │   ├── layout/       # layout components
│   │   ├── api/          # cloud dev API wrapper
│   │   └── router/       # routing + auth guards
│   └── vite.config.js    # Vite build config
│
├── cloudfunctions/       # cloud functions
│   ├── createOrder/      # create order
│   ├── createPayment/    # create payment
│   ├── payCallback/      # payment callback
│   ├── cancelAndRefund/  # cancel & refund
│   ├── updateOrderStatus/# update order status
│   ├── getAdminOrders/   # admin order query
│   ├── couponManager/    # coupon management
│   ├── generateTableCode/# table code generation
│   ├── loginAdmin/       # admin login
│   └── resetDailySales/  # daily sales reset
│
└── project.config.json   # mini-program project config
```

## Tech Stack

| Module | Technology |
|--------|------------|
| Mini-program | WeChat native (WXML/WXSS/JS) |
| Admin dashboard | Vue 3 + Vue Router 4 |
| Build tool | Vite 5 |
| Cloud service | WeChat Cloud Development (functions + database + storage) |
| Backend SDK | wx-server-sdk / @cloudbase/js-sdk |
| Other | qrcode (table code generation) |

## Features

### Mini-program (customer)

- **Scan-to-order**: dine-in scan binds table number / takeout mode toggle
- **Menu browsing**: category filter, product search, spec selection
- **Shopping cart**: full CRUD, local persistence (StorageSync)
- **WeChat Pay**: order payment, callback handling
- **Order management**: list, detail, status tracking
- **Coupons**: coupon center, selection at checkout, auto redemption

### Admin dashboard (merchant)

- **Data dashboard**: real-time order stats, sales data
- **Order management**: accept / cooking / done state machine, refunds
- **Product management**: categories, CRUD, on/off shelf, featured
- **Coupon management**: create / edit / delete, product association
- **Table code management**: batch QR code generation
- **Store settings**: store info configuration

## Quick Start

### Prerequisites

- [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) latest stable
- Node.js 16+
- A WeChat mini-program account with Cloud Development enabled

### Mini-program

1. Clone and import into WeChat DevTools:

```bash
git clone https://github.com/WorthChecking/WeChat-Miniprogram.git
```

2. In WeChat DevTools, choose "Import Project", select the repo root.
3. Enter your AppID; verify `appid` in `project.config.json`.
4. Enable Cloud Development and note the environment ID.
5. Replace the env ID in `miniprogram/app.js`:

```javascript
this.globalData = {
  env: "YOUR_ENV_ID",
  // ...
};
```

6. Right-click the `cloudfunctions` directory → "Upload and Deploy: Install Dependencies in the Cloud".

### Admin dashboard

#### Local development

1. Install dependencies and start the dev server:

```bash
cd admin
npm install
npm run dev
```

2. Open `http://localhost:3000` in your browser for local debugging.
3. Replace `ENV_ID` in `admin/src/api/cloud.js` with your cloud env ID:

```javascript
const ENV_ID = 'YOUR_ENV_ID'
```

#### Production deployment

1. Build for production:

```bash
npm run build
```

2. Deploy `admin/dist/` to your own server or static hosting (WeChat CloudBase static hosting, Vercel, Netlify, Nginx, etc.).
3. Access the admin dashboard via your own registered domain; HTTPS is required in production.
4. Ensure the cloud env ID, database permission rules, and cloud function auth match the [deployment security checklist](#deployment-security-checklist).

### Cloud Database Collections

Create these collections in the Cloud Development console (permission rules in the [security checklist](#deployment-security-checklist)):

| Collection | Description |
|------------|-------------|
| `goods` | products |
| `categories` | categories |
| `orders` | orders |
| `coupons` | coupons |
| `couponGoods` | coupon-product associations |
| `tableCodes` | table codes |
| `settings` | store config |
| `admins` | admin accounts |

## Deployment Security Checklist

Before deploying to production, you **must** complete the following — otherwise privilege-escalation and payment risks exist:

1. **Database permission rules**:
   - `admins`, `settings`: creator-only read/write; block direct frontend reads
   - `orders`: `openid == auth.openid` (users read only their own orders)
   - `goods` / `categories` / `coupons` / `couponGoods` / `tableCodes`: world-readable, admin-write-only
2. **Cloud function auth**: `getAdminOrders` / `couponManager` / `generateTableCode` / `loginAdmin` / `resetDailySales` must verify inside the function that the caller is a valid admin in the `admins` collection — **never rely on hidden UI entries**
3. **Payment integrity**: `createPayment` amounts must be computed server-side from the `goods` collection — **never trust client-supplied amounts**; `payCallback` must verify WeChat signatures and be idempotent
4. **AppSecret**: lives only in cloud function env vars or the mini-program backend — **never in frontend code or git**
5. **Admin passwords**: stored salted-hashed in `admins` — never plaintext

Full details in [SECURITY.md](SECURITY.md).

## Next Steps

After deployment, proceed with:

1. **CI checks**: On the next push or PR, [`.github/workflows/ci.yml`](.github/workflows/ci.yml) automatically runs the admin build and cloud function syntax checks — see the **Actions** tab.
2. **Release**: [CHANGELOG.md](CHANGELOG.md) records v1.0.0; tag it `v1.0.0` on the [Releases](https://github.com/WorthChecking/WeChat-Miniprogram/releases) page.
3. **Fill in env ID & AppID**: Replace `YOUR_ENV_ID` in [`miniprogram/app.js`](miniprogram/app.js) and [`admin/src/api/cloud.js`](admin/src/api/cloud.js) with your own cloud env ID; replace `appid` in `project.config.json` with your own AppID.
4. **Upload cloud functions**: In WeChat DevTools, right-click the `cloudfunctions` directory → "Upload and Deploy: Install Dependencies in the Cloud".
5. **Verify auth**: Audit database permission rules and cloud function auth per [SECURITY.md](SECURITY.md) to avoid privilege escalation and payment risks.

## Roadmap

- [ ] Dashboard: time-of-day sales curve + best-seller list
- [ ] Coupons: support fixed-discount / percentage / exchange types
- [ ] Table code: scan preview + batch print templates
- [ ] Multi-store / multi-branch support
- [ ] Order receipt printing

## Contributing

Issues and PRs welcome. Before submitting, read [CONTRIBUTING.md](CONTRIBUTING.md) and confirm:

- No hardcoded env IDs or secrets
- `node_modules` / `admin/dist` / `project.private.config.json` / `database_export-*.json` are not committed
- Database schema changes are documented in the PR
- Conventional Commits format is followed

## Security Policy

For security vulnerabilities, **do not** open a public issue — report privately per [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 WorthChecking
