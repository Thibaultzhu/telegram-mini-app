import { Router, Request, Response } from 'express';
import { telegramAuth } from '../middleware/auth.js';
import {
  getJettonWalletAddress,
  buildJettonTransferPayload,
  verifyJettonTransfer,
} from '../services/ton-payment.js';

export const usdtPaymentsRouter = Router();

/**
 * USDT 稳定币支付路由
 *
 * TON 上 USDT 的工作原理：
 * - USDT 是一个 Jetton（TON 上的代币标准，类似 ERC-20）
 * - 每个用户有一个独立的 Jetton Wallet 合约（由 Master 合约派生）
 * - 转账 = 向自己的 Jetton Wallet 发送 transfer 消息，指定接收方
 * - 接收方的 Jetton Wallet 会收到 internal_transfer 消息
 */

/**
 * POST /api/payments/usdt/prepare
 * 准备 USDT 转账参数
 * 
 * 前端需要知道：
 * 1. 用户的 Jetton Wallet 地址（用于发送交易的目标地址）
 * 2. 转账消息体（payload）
 * 3. 需要附带的 TON 金额（用于 gas）
 */
usdtPaymentsRouter.post('/prepare', telegramAuth, async (req: Request, res: Response) => {
  try {
    const { senderAddress, amount, orderId } = req.body;

    if (!senderAddress || !amount || !orderId) {
      return res.status(400).json({ error: 'Missing: senderAddress, amount, orderId' });
    }

    const USDT_MASTER = process.env.USDT_MASTER_ADDRESS!;
    const MERCHANT_WALLET = process.env.TON_MERCHANT_ADDRESS!;

    // 1. 计算用户的 USDT Jetton Wallet 地址
    //    每个用户对每种 Jetton 有一个独立的钱包合约
    const jettonWalletAddress = await getJettonWalletAddress(
      USDT_MASTER,
      senderAddress
    );

    // 2. 构造 Jetton Transfer 消息体
    //    包含：金额、接收方、回调地址、forward payload（含订单ID）
    const transferPayload = buildJettonTransferPayload({
      jettonAmount: BigInt(Math.floor(amount * 1_000_000)), // USDT 6位小数
      toAddress: MERCHANT_WALLET,
      responseAddress: senderAddress, // 余额通知返回给发送者
      forwardPayload: orderId,       // 订单 ID 作为 comment，用于后端匹配
    });

    // 3. 需要附带的 TON 金额（gas fee + forward fee）
    //    通常 0.05-0.1 TON 足够
    const forwardTon = '100000000'; // 0.1 TON = 100000000 nanoton

    // 4. 保存订单到数据库
    // await prisma.payment.create({
    //   data: { orderId, amount, currency: 'USDT', method: 'TON_JETTON', status: 'PENDING' }
    // });

    res.json({
      jettonWalletAddress,
      transferPayload,
      forwardTon,
    });
  } catch (error) {
    console.error('Prepare USDT payment error:', error);
    res.status(500).json({ error: 'Failed to prepare payment' });
  }
});

/**
 * POST /api/payments/usdt/create
 * 使用 TON Pay SDK 创建支付（推荐方案）
 */
usdtPaymentsRouter.post('/create', telegramAuth, async (req: Request, res: Response) => {
  try {
    const { amount, orderId, senderAddress } = req.body;

    if (!amount || !orderId || !senderAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 使用 TON Pay SDK 创建转账
    // import { createTonPayTransfer } from '@ton-pay/api';
    //
    // const { message, reference, bodyBase64Hash } = await createTonPayTransfer(
    //   {
    //     amount: amount,
    //     asset: process.env.USDT_MASTER_ADDRESS!, // Jetton 地址 = USDT
    //     recipientAddr: process.env.TON_MERCHANT_ADDRESS!,
    //     senderAddr: senderAddress,
    //     commentToSender: `Order #${orderId}`,
    //   },
    //   { chain: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet' }
    // );
    //
    // // 保存 reference 用于后续查询状态
    // await prisma.payment.create({
    //   data: { orderId, reference, bodyBase64Hash, amount, status: 'PENDING' }
    // });
    //
    // res.json({ transferMessage: message });

    // 临时返回（安装 TON Pay SDK 后替换上面的代码）
    res.json({ transferMessage: { address: '', amount: '0', payload: '' } });
  } catch (error) {
    console.error('Create USDT payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

/**
 * POST /api/payments/usdt/verify
 * 验证 USDT 支付交易
 */
usdtPaymentsRouter.post('/verify', telegramAuth, async (req: Request, res: Response) => {
  try {
    const { orderId, boc } = req.body;

    if (!orderId || !boc) {
      return res.status(400).json({ error: 'Missing: orderId, boc' });
    }

    // 验证交易
    const isValid = await verifyJettonTransfer({
      boc,
      expectedRecipient: process.env.TON_MERCHANT_ADDRESS!,
      expectedOrderId: orderId,
    });

    if (isValid) {
      // 更新订单状态
      // await prisma.payment.update({
      //   where: { orderId },
      //   data: { status: 'COMPLETED', tonTxHash: extractTxHash(boc) }
      // });

      res.json({ verified: true });
    } else {
      res.json({ verified: false, error: 'Transaction verification failed' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/payments/usdt/webhook
 * TON Pay Webhook 回调（自动通知支付状态变更）
 * 配置方式：在 TON Pay Merchant Dashboard 设置 webhook URL
 */
usdtPaymentsRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { reference, status, txHash } = req.body;

    // TODO: 验证 webhook 签名（使用 TON Pay API Key）
    // const isValid = verifyWebhookSignature(req.headers, req.body);

    console.log('TON Pay webhook:', { reference, status, txHash });

    if (status === 'completed') {
      // 通过 reference 找到对应订单并更新
      // await prisma.payment.update({
      //   where: { reference },
      //   data: { status: 'COMPLETED', tonTxHash: txHash }
      // });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.json({ ok: true }); // 始终返回 200
  }
});
