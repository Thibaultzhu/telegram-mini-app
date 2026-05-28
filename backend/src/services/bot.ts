import { Bot, Context } from 'grammy';

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is required');
}

// 创建 Bot 实例
export const bot = new Bot(process.env.BOT_TOKEN);

/**
 * 初始化 Bot 并设置所有事件处理器
 */
export async function setupBot() {
  // /start 命令 - 发送欢迎消息和 Mini App 按钮
  bot.command('start', async (ctx: Context) => {
    const webAppUrl = process.env.FRONTEND_URL || 'https://your-miniapp.com';
    
    await ctx.reply(
      '👋 欢迎使用我们的 Mini App！\n\n点击下方按钮打开应用：',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 打开 Mini App',
                web_app: { url: webAppUrl },
              },
            ],
          ],
        },
      }
    );
  });

  // 处理 pre_checkout_query（Stars 支付前的确认）
  bot.on('pre_checkout_query', async (ctx) => {
    // 在这里可以进行库存检查、价格验证等
    // 如果一切正常，回复 ok
    try {
      await ctx.answerPreCheckoutQuery(true);
    } catch (error) {
      console.error('Pre-checkout error:', error);
      await ctx.answerPreCheckoutQuery(false, {
        error_message: '支付处理失败，请重试',
      });
    }
  });

  // 处理成功支付事件
  bot.on('message:successful_payment', async (ctx) => {
    const payment = ctx.message.successful_payment;
    
    console.log('Payment received:', {
      amount: payment.total_amount,
      currency: payment.currency,
      payload: payment.invoice_payload,
      userId: ctx.from?.id,
    });

    // TODO: 在数据库中记录支付，发放商品
    // 1. 解析 payload 获取订单信息
    // 2. 更新用户余额/道具
    // 3. 发送确认消息

    await ctx.reply(
      `✅ 支付成功！\n\n` +
      `金额: ${payment.total_amount} ⭐\n` +
      `感谢您的购买！商品已到账。`
    );
  });

  // 设置 Webhook（生产环境）
  if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
    await bot.api.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);
    console.log('✅ Webhook set:', `${process.env.WEBHOOK_URL}/webhook`);
  } else {
    // 开发环境使用长轮询
    bot.start();
    console.log('🤖 Bot started in polling mode');
  }
}
