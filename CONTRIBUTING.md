# 贡献指南

感谢你对 William 厨房点餐系统的关注！这是一个基于微信云开发的全栈项目，涵盖小程序端、管理后台与云函数三部分。本文档说明了参与贡献的流程与规范。

## 📋 项目红线（必读）

在贡献代码前，请务必遵守以下三条绝对红线（详见 [SECURITY.md](SECURITY.md)）：

1. **支付红线**：`createPayment` 的金额必须由服务端从 `goods` 集合实时计算，**禁止信任前端传入的金额**；`payCallback` 必须校验微信签名并做幂等处理；`cancelAndRefund` 涉及退款的逻辑必须本地充分验证，避免资金回归。
2. **鉴权红线**：所有管理端云函数（`getAdminOrders` / `couponManager` / `generateTableCode` / `loginAdmin` / `resetDailySales`）必须在函数内校验调用者为 `admins` 集合中的有效管理员，**不得依赖前端隐藏入口或路由守卫**。前端鉴权只是体验优化，服务端鉴权才是安全边界。
3. **数据红线**：`admins` 集合的密码必须加盐哈希存储，**禁止明文**；`orders` 集合的权限规则必须为 `openid == auth.openid`（用户仅能读自己的订单）；不得提交真实的云环境 ID、AppSecret、订单导出文件（`database_export-*.json`）。

## 🛠️ 开发环境搭建

### 前置依赖

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新稳定版
- Node.js 16+（管理后台构建）
- 已开通微信云开发的微信小程序账号

### 小程序端

1. 在微信开发者工具中导入项目根目录，填入 AppID
2. 在 [`miniprogram/app.js`](miniprogram/app.js) 中填入云环境 ID
3. 右键 `cloudfunctions` 目录 →「上传并部署：云端安装依赖」

### 管理后台

```bash
cd admin
npm install
npm run dev      # 本地调试 http://localhost:3000
npm run build    # 生产构建
```

在 [`admin/src/api/cloud.js`](admin/src/api/cloud.js) 中填入云环境 ID。

## 📐 代码规范

### 小程序端（WXML/WXSS/JS）

- 缩进 2 空格，文件末尾保留一个空行
- 事件处理函数使用普通函数，**禁止使用箭头函数**（会丢失 `this`）
- **禁止使用可选链 `?.`、空值合并 `??`**（微信小程序对部分 ES2020+ 语法支持不全），请用 `&&` / `||` 替代
- 数据更新使用 `this.setData({ key: value })`；深层路径用 `this.setData({ 'a.b.c': v })`
- 列表渲染必须写 `wx:key`，避免使用 `index` 作为 key（除非性能不敏感）

### 管理后台（Vue 3）

- 组件采用 `<script setup>` 与 Composition API
- 路由守卫与鉴权逻辑位于 [`admin/src/router/`](admin/src/router/)，新增页面需同步注册路由并配置 `meta.requiresAuth`
- 云开发调用统一走 [`admin/src/api/cloud.js`](admin/src/api/cloud.js) 封装，**禁止在组件内直接 `@cloudbase/js-sdk` 调用**

### 云函数（Node.js）

- 统一 `wx-server-sdk`，`cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })`
- 返回结构保持 `{ success, errMsg, data }` 一致约定
- 涉及支付的函数（`createPayment` / `payCallback` / `cancelAndRefund`）修改时务必本地充分验证
- 管理端函数必须复核调用者身份（见鉴权红线）

### 订单状态机约定

| 状态码 | 名称 | 说明 |
|---|---|---|
| `making` | 制作中 | 订单创建后初始状态（待支付前） |
| `pending` | 待支付 | 等待支付（`createPayment` 校验此状态） |
| `preparing` | 已支付/备餐中 | `payCallback` 成功后流转到此 |
| `completed` | 已完成 | 商家确认出餐 |
| `cancelled` | 已取消 | 取消并退款 |

## 📝 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>
```

### Type 列表

| Type | 说明 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构（不改变行为） |
| `perf` | 性能优化 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响逻辑） |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |

### Scope 建议

- `miniprogram` — 小程序端
- `admin` — 管理后台
- `orders` — 订单相关云函数
- `payment` — 支付/退款云函数
- `coupons` — 优惠券云函数
- `auth` — 鉴权与登录
- `docs` — 文档

### 示例

```
feat(coupons): 优惠券支持满减类型

fix(payment): 修复回调签名校验失败

refactor(admin): 抽取订单状态流转逻辑
```

## 🔄 PR 流程

1. **Fork** 本仓库并创建特性分支：`git checkout -b feat/your-feature`
2. **开发**：遵循上述代码规范与红线，确保本地自测通过
3. **提交**：按提交规范编写 commit message
4. **PR**：向 `main` 分支发起 Pull Request，填写 PR 模板
5. **Review**：等待代码审查，根据反馈调整
6. **Merge**：通过审查后合并

### PR 检查清单

- [ ] 不违反三条红线（支付/鉴权/数据）
- [ ] 未硬编码云环境 ID、AppSecret 或任何密钥
- [ ] `node_modules` / `admin/dist` / `project.private.config.json` / `database_export-*.json` 未被提交
- [ ] 涉及支付的改动已服务端校验金额，不信任前端
- [ ] 涉及管理端的改动已在云函数内校验管理员身份
- [ ] commit message 符合 Conventional Commits 规范
- [ ] 小程序端未使用箭头函数事件处理、可选链、空值合并

## 🐛 报告问题

- Bug 请使用 [Bug Report 模板](https://github.com/WorthChecking/WeChat-Miniprogram/issues/new?template=bug_report.yml)
- 新功能建议请使用 [Feature Request 模板](https://github.com/WorthChecking/WeChat-Miniprogram/issues/new?template=feature_request.yml)
- 安全漏洞请**不要**在公开 Issue 中讨论，按 [SECURITY.md](SECURITY.md) 私下报告

## 📧 联系方式

- 维护者：[@WorthChecking](https://github.com/WorthChecking)
- Issue：[https://github.com/WorthChecking/WeChat-Miniprogram/issues](https://github.com/WorthChecking/WeChat-Miniprogram/issues)

---

感谢你的贡献！🍜
