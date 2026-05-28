import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { paymentsRouter } from './routes/payments.js';
import { usdtPaymentsRouter } from './routes/usdt-payments.js';
import { webhookRouter } from './routes/webhook.js';
import { setupBot } from './services/bot.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Webhook 路由需要 raw body（放在 json 解析之前）
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRouter);

// 其他路由使用 JSON 解析
app.use(express.json());

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/payments/usdt', usdtPaymentsRouter);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务
async function start() {
  try {
    // 初始化 Telegram Bot
    await setupBot();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Bot webhook ready at /webhook`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
