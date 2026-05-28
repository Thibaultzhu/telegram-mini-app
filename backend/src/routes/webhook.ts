import { Router, Request, Response } from 'express';
import { bot } from '../services/bot.js';
import { webhookCallback } from 'grammy';

export const webhookRouter = Router();

/**
 * POST /webhook
 * Telegram Bot Webhook 接收端
 * 处理所有来自 Telegram 的事件（消息、支付、回调等）
 */
webhookRouter.post('/', async (req: Request, res: Response) => {
  try {
    // grammy 的 webhook 处理
    const handler = webhookCallback(bot, 'express');
    await handler(req, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200); // 始终返回 200 避免 Telegram 重试
  }
});
