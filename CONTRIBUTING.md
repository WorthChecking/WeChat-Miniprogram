# 贡献指南

感谢你对 William 厨房点餐系统的关注。这是一个基于微信云开发的全栈项目，涵盖小程序端、管理后台与云函数三部分，欢迎提交 Issue 与 Pull Request。

## 项目结构

```
miniprogram/      # 微信小程序端（WXML/WXSS/JS 原生）
admin/            # 管理后台（Vue 3 + Vite 5 + Vue Router 4）
cloudfunctions/   # 云函数（Node.js + wx-server-sdk）
project.config.json   # 小程序项目配置
```

- 小程序端页面位于 `miniprogram/pages/`，每页包含 `.js / .wxml / .wxss / .json` 四件套。
- 管理后台源码在 `admin/src/`，构建产物 `admin/dist/` 已被 `.gitignore` 忽略。
- 每个云函数独立一个目录，含 `index.js / package.json / config.json`，部署时需「上传并部署：云端安装依赖」。

## 开发环境

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新稳定版
- Node.js 16+（管理后台构建）
- 已开通微信云开发的小程序账号

本地启动管理后台：

```bash
cd admin
npm install
npm run dev      # 默认 http://localhost:3000
```

小程序端导入微信开发者工具，填入 AppID 并在 `miniprogram/app.js` 中配置云环境 ID。

## 代码规范

### 通用

- 缩进 2 空格，文件末尾保留一个空行。
- **不要提交敏感信息**：云环境 ID、AppSecret、数据库导出文件、个人 openid 等不得出现在代码或示例中。
- `project.private.config.json` 与 `database_export-*.json` 已在 `.gitignore` 中忽略，请勿强行提交。

### 小程序端（WXML/WXSS/JS）

- 事件处理函数使用普通函数，**禁止使用箭头函数**（会丢失 `this`）。
- 微信小程序对部分 ES2020+ 语法支持不全：**禁止使用可选链 `?.`、空值合并 `??`**，请用 `&&` / `||` 替代。
- 数据更新使用 `this.setData({ key: value })`；深层路径用 `this.setData({ 'a.b.c': v })`。
- 列表渲染必须写 `wx:key`，避免使用 `index` 作为 key（除非性能不敏感）。

### 管理后台（Vue 3）

- 组件采用 `<script setup>` 与 Composition API。
- 路由守卫与鉴权逻辑位于 `admin/src/router/`，新增页面需同步注册路由并配置 `meta.requiresAuth`。
- 云开发调用统一走 `admin/src/api/cloud.js` 封装，禁止在组件内直接 `@cloudbase/js-sdk` 调用。

### 云函数（Node.js）

- 统一 `wx-server-sdk`，`cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })`。
- 返回结构保持 `{ code, msg, data }` 一致约定。
- 涉及支付的函数（`createPayment` / `payCallback` / `cancelAndRefund`）修改时务必本地充分验证，避免资金逻辑回归。

## 提交规范

使用 Conventional Commits 风格：

```
<type>(<scope>): <subject>

feat(orders): 新增订单备注字段
fix(payment): 修复回调签名校验失败
docs(readme): 补充云函数部署说明
refactor(cart): 抽取购物车持久化逻辑
```

`type` 建议：`feat / fix / docs / style / refactor / perf / test / chore`。

## 提交流程

1. Fork 仓库并新建分支：`git checkout -b feat/your-feature`。
2. 本地开发并自测（小程序端在开发者工具中预览，管理后台 `npm run build` 通过）。
3. 提交前确认：
   - 没有引入新的依赖泄露（`node_modules`、`admin/dist` 不可提交）。
   - 没有硬编码的云环境 ID 或密钥。
   - 涉及数据库结构变更时，已在 Issue / PR 中说明集合字段。
4. 提交 PR 至 `main` 分支，描述清晰动机、变更范围与测试方式。
5. 等待 Review，必要时补充修改。

## 报告问题

- 功能缺陷或建议请提 [Issue](https://github.com/WorthChecking/WeChat-Miniprogram/issues)，附复现步骤、微信开发者工具版本与基础库版本。
- 涉及支付、鉴权、用户数据的敏感问题，请按 [SECURITY.md](SECURITY.md) 私下报告，**不要开公开 Issue**。
