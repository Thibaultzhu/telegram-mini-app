import { Router, Request, Response } from 'express';
import { validateInitData, parseInitData } from '../utils/validate.js';

export const authRouter = Router();

/**
 * POST /api/auth/telegram
 * 验证 Telegram initData 并返回用户信息
 * 前端首次打开时调用此接口完成认证
 */
authRouter.post('/telegram', async (req: Request, res: Response) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 验证 initData 签名
    if (!validateInitData(initData, botToken)) {
      return res.status(401).json({ error: 'Invalid initData' });
    }

    // 解析用户信息
    const user = parseInitData(initData);
    if (!user) {
      return res.status(401).json({ error: 'Cannot parse user data' });
    }

    // TODO: 在数据库中创建或更新用户记录
    // const dbUser = await prisma.user.upsert({
    //   where: { telegramId: user.id },
    //   update: { firstName: user.firstName, username: user.username },
    //   create: { telegramId: user.id, firstName: user.firstName, username: user.username },
    // });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
      },
      // TODO: 生成 JWT token 用于后续请求
      token: 'placeholder_jwt_token',
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
