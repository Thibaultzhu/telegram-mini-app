# Telegram Mini App 全栈项目

## 快速开始

### 前置要求
- Node.js 20+
- npm 或 pnpm
- PostgreSQL 数据库（本地或云端）
- Redis（本地或 Upstash）
- Telegram 账号

### 第一步：创建 Telegram Bot

1. 打开 Telegram，搜索 `@BotFather`
2. 发送 `/newbot`，按提示设置名称
3. 保存获得的 `BOT_TOKEN`
4. 发送 `/newapp`，选择你的 Bot
5. 设置 Mini App 的 URL（开发阶段先用 ngrok）

### 第二步：启动后端

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入你的 BOT_TOKEN 和数据库信息

npm install
npx prisma db push   # 创建数据库表
npm run dev          # 启动开发服务器（端口 3000）
```

### 第三步：启动前端

```bash
cd frontend
npm install

# 创建 .env 文件
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env

npm run dev          # 启动开发服务器（端口 5173）
```

### 第四步：本地调试

Telegram Mini App 要求 HTTPS，本地开发需要隧道工具：

```bash
# 方案 A：使用 ngrok
ngrok http 5173
# 将获得的 https://xxx.ngrok.io 地址设置到 BotFather

# 方案 B：使用 Cloudflare Tunnel（免费）
cloudflared tunnel --url http://localhost:5173
```

### 第五步：部署

**前端部署到 Vercel：**
```bash
cd frontend
npm run build
# 连接 GitHub 仓库，Vercel 自动部署
```

**后端部署到 Railway：**
```bash
cd backend
# 连接 GitHub 仓库
# 设置环境变量
# Railway 自动部署
```

**部署后更新 BotFather：**
在 BotFather 中将 Mini App URL 更新为生产环境地址。

---

## 项目结构

```
telegram-mini-app/
├── frontend/                    # 前端 Mini App
│   ├── public/
│   │   └── tonconnect-manifest.json  # TON Connect 配置
│   ├── src/
│   │   ├── components/          # 通用组件
│   │   │   └── Navigation.tsx   # 底部导航栏
│   │   ├── pages/               # 页面组件
│   │   │   ├── HomePage.tsx     # 首页
│   │   │   ├── ShopPage.tsx     # 商店页
│   │   │   ├── PaymentPage.tsx  # 支付/钱包页
│   │   │   └── ProfilePage.tsx  # 个人中心
│   │   ├── hooks/               # 自定义 Hooks
│   │   │   ├── useTelegramWebApp.ts  # Telegram WebApp API 封装
│   │   │   └── useAppStore.ts   # Zustand 全局状态
│   │   ├── utils/
│   │   │   └── api.ts           # API 请求工具
│   │   ├── App.tsx              # 根组件
│   │   ├── main.tsx             # 入口文件
│   │   └── index.css            # 全局样式
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                     # 后端服务
│   ├── prisma/
│   │   └── schema.prisma        # 数据库模型
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts          # 认证路由
│   │   │   ├── products.ts      # 商品路由
│   │   │   ├── payments.ts      # 支付路由
│   │   │   └── webhook.ts       # Bot Webhook
│   │   ├── middleware/
│   │   │   └── auth.ts          # initData 验证中间件
│   │   ├── services/
│   │   │   └── bot.ts           # Telegram Bot 逻辑
│   │   ├── utils/
│   │   │   └── validate.ts      # initData 验证工具
│   │   └── index.ts             # 服务入口
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── docs/
    └── 项目分析报告.md
```

## 支付流程图

### Telegram Stars 支付流程
```
用户点击购买 → 前端调用 /api/payments/stars/create-invoice
    → 后端通过 Bot API 生成 invoiceLink
    → 前端调用 openTelegramLink(invoiceLink)
    → Telegram 弹出支付界面
    → 用户确认支付
    → Bot 收到 pre_checkout_query → 回复确认
    → 支付完成 → Bot 收到 successful_payment
    → 后端处理订单、发放商品
```

### TON 支付流程
```
用户连接 TON 钱包（Tonkeeper 等）
    → 用户点击 TON 支付
    → 前端构造交易（收款地址+金额）
    → TON Connect SDK 发起交易签名
    → 用户在钱包中确认
    → 交易广播到 TON 网络
    → 前端/后端监听交易确认
    → 确认后处理订单
```

## 运维注意事项

1. **HTTPS 是强制要求**：Telegram Mini App 只能加载 HTTPS 页面
2. **initData 有效期**：initData 签名应检查时间戳，建议 5 分钟内有效
3. **Bot Webhook 必须 200**：无论处理是否成功，Webhook 端点都应返回 200
4. **Stars 提现规则**：最低 1000 Stars，21 天冻结期，通过 Fragment 提现
5. **TON 手续费极低**：< $0.01/笔，但需要用户自备 TON 钱包
