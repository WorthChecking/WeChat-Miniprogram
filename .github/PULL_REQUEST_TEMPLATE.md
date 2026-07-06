## 📌 PR 概述

<!-- 一句话描述本 PR 做了什么，关联 Issue 请写 Closes #xxx -->

## 🔄 变更类型

- [ ] 🆕 新功能 (feat)
- [ ] 🐛 Bug 修复 (fix)
- [ ] ♻️ 重构 (refactor)
- [ ] ⚡ 性能优化 (perf)
- [ ] 📚 文档 (docs)
- [ ] 🎨 代码格式 (style)
- [ ] 🔧 构建/工具 (chore)

## 📝 变更内容

<!-- 详细列出本 PR 的变更点 -->

-
-
-

## 📌 影响范围

- [ ] 小程序端（miniprogram/）
- [ ] 管理后台（admin/）
- [ ] 云函数（cloudfunctions/）
- [ ] 文档
- [ ] 其他：

## ✅ 红线自检

> 提交前请逐项确认，违反任一红线将无法合并（详见 [CONTRIBUTING.md](../CONTRIBUTING.md#-项目红线必读)）

- [ ] **支付红线**：涉及支付的改动，金额由服务端从 `goods` 集合实时计算，不信任前端传入
- [ ] **鉴权红线**：管理端云函数改动已在函数内校验调用者为 `admins` 有效管理员，不依赖前端隐藏入口
- [ ] **数据红线**：未硬编码云环境 ID、AppSecret 或任何密钥；密码未明文存储
- [ ] `payCallback` 改动做了签名校验与幂等处理
- [ ] `orders` 权限规则未破坏 `openid == auth.openid`

## 🧪 测试

<!-- 如何验证本 PR 的变更 -->

- [ ] 小程序端在微信开发者工具中预览正常
- [ ] 管理后台 `npm run build` 通过
- [ ] 涉及订单/支付的改动已走通完整链路
- [ ] 涉及优惠券的改动已验证领取/选择/核销
- [ ] `node_modules` / `admin/dist` / `project.private.config.json` / `database_export-*.json` 未被提交
- [ ] 无控制台报错

## 📸 截图/录屏

<!-- 如涉及 UI 变更，请附截图或录屏 -->

## 📝 提交规范自检

- [ ] commit message 遵循 Conventional Commits
- [ ] 小程序端未使用箭头函数事件处理、可选链 `?.`、空值合并 `??`
