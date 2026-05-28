import { Router, Request, Response } from 'express';
import { telegramAuth } from '../middleware/auth.js';
import { bot } from '../services/bot.js';

export const paymentsRouter = Router();

/**
 * POST /api/payments/stars/create-invoice
 * 创建 Telegram Stars 支付发票链接
 *
 * Telegram Stars 支付流程：
 * 1. 前端请求此接口创建发票
 * 2. 返回 invoiceLink 给前端
 * 3. 前端通过 openTelegramLink 打开支付界面
 * 4. 用户支付后，Bot 收到 pre_checkout_query → 回复确认
 * 5. 支付成功后 Bot 收到 successful_payment 事件
 */
paymentsRouter.post('/stars/create-invoice', telegramAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, amount, payload } = req.body;

    if (!title || !description || !amount || !payload) {
      return res.status(400).json({ error: 'Missing required fields: title, description, amount, payload' });
    }

    // 通过 Bot API 创建发票链接
    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload, // 自定义 payload，支付成功后会回传
      '', // provider_token 留空（Stars 支付不需要第三方提供商）
      'XTR', // 货币代码：XTR = Telegram Stars
      [{ label: title, amount: amount }], // prices 数组
    );

    res.json({ invoiceLink });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

/**
 * POST /api/payments/ton/verify
 * 验证 TON 交易
 */
paymentsRouter.post('/ton/verify', telegramAuth, async (req: Request, res: Response) => {
  try {
    const { transactionHash, expectedAmount } = req.body;

    if (!transactionHash) {
      return res.status(400).json({ error: 'Transaction hash is required' });
    }

    // TODO: 通过 TON API 验证交易
    // 1. 查询交易详情
    // 2. 确认收款地址正确
    // 3. 确认金额正确
    // 4. 确认交易已确认（非 pending）

    res.json({ verified: true, message: 'Transaction verified successfully' });
  } catch (error) {
    console.error('TON verify error:', error);
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});
