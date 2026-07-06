# 美味小厨 - 微信小程序用户端

## 项目说明

这是一个基于微信云开发的在线点餐系统用户端小程序，包含以下功能：

- **首页**：店铺信息、扫码点餐、今日推荐、订单状态
- **点餐页**：商品分类、商品列表、购物车
- **订单列表**：订单状态筛选、订单卡片
- **个人中心**：用户信息、我的资产、功能菜单
- **购物车**：商品管理、用餐方式、提交订单
- **订单详情**：订单信息、取餐码

## 快速开始

### 1. 导入项目

1. 打开微信开发者工具
2. 导入项目，选择 `miniprogram` 目录
3. 填入您的 AppID（在 [微信公众平台](https://mp.weixin.qq.com/) 获取）

### 2. 开通云开发

1. 点击工具栏「云开发」按钮
2. 开通云开发环境
3. 记录您的云环境 ID（在云开发控制台获取）

### 3. 初始化数据库

在云开发控制台创建以下集合：

| 集合名称 | 说明 |
|---------|------|
| categories | 商品分类 |
| goods | 商品信息 |
| orders | 订单信息 |
| settings | 系统设置 |

#### 添加测试数据

**categories 集合**：
```json
[
  { "name": "推荐", "sort": 1 },
  { "name": "主食", "sort": 2 },
  { "name": "小吃", "sort": 3 },
  { "name": "饮品", "sort": 4 },
  { "name": "套餐", "sort": 5 }
]
```

**goods 集合**：
```json
[
  { "name": "招牌牛肉面", "description": "精选牛骨熬制汤底", "price": 28, "sales": 328, "categoryId": "分类ID", "isRecommend": true, "status": "active", "sort": 1 },
  { "name": "香辣鸡腿堡", "description": "外酥里嫩 香辣可口", "price": 22, "sales": 256, "categoryId": "分类ID", "isRecommend": true, "status": "active", "sort": 2 },
  { "name": "鲜榨橙汁", "description": "新鲜橙子现榨", "price": 15, "sales": 189, "categoryId": "分类ID", "isRecommend": true, "status": "active", "sort": 3 }
]
```

**settings 集合**：
```json
{
  "_id": "storeInfo",
  "name": "美味小厨",
  "status": "营业中",
  "openTime": "09:00",
  "closeTime": "21:00",
  "phone": "400-123-4567",
  "address": "美食街1号"
}
```

### 4. 设置数据库权限

在云开发控制台 → 数据库 → 权限设置，将以下集合权限设置为「所有用户可读，仅创建者可写」：

- categories
- goods
- settings

将 orders 集合权限设置为「仅创建者可读写」。

### 5. 上传云函数

将 `cloudfunctions` 目录下的云函数上传部署：

1. 右键点击 `cloudfunctions` 文件夹
2. 选择「同步云函数列表」
3. 逐个右键点击云函数文件夹，选择「上传并部署」

## 项目结构

```
miniprogram/
├── pages/
│   ├── index/          # 首页
│   ├── menu/           # 点餐页
│   ├── orders/         # 订单列表
│   ├── mine/           # 个人中心
│   ├── cart/           # 购物车
│   └── orderDetail/    # 订单详情
├── utils/
│   ├── util.js         # 工具函数
│   └── initDatabase.js # 数据库初始化
├── images/             # 图片资源
├── app.js              # 小程序入口
├── app.json            # 全局配置
└── app.wxss            # 全局样式
```

## 配色方案

| 颜色 | 色值 | 用途 |
|------|------|------|
| 主色调 | #FF8C42 | 按钮、强调 |
| 背景色 | #FFF8F0 | 页面背景 |
| 文字色 | #5D4037 | 主要文字 |
| 辅助色 | #666666 | 次要文字 |

## 注意事项

1. 微信小程序不支持 ES6 可选链语法 `?.`，请使用 `&&` 替代
2. 事件处理函数不能使用箭头函数
3. 云函数需要 Node.js 运行环境，请在云开发控制台配置

## 相关链接

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
