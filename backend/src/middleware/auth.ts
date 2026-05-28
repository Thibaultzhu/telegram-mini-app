import { Request, Response, NextFunction } from 'express';
import { validateInitData, parseInitData } from '../utils/validate.js';

/**
 * Telegram initData 验证中间件
 * 从 Authorization header 中提取并验证 initData
 * 格式: Authorization: tma <initData>
 */
export function telegramAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('tma ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const initData = authHeader.slice(4); // 去掉 "tma " 前缀
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error('BOT_TOKEN not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // 验证签名
  if (!validateInitData(initData, botToken)) {
    return res.status(401).json({ error: 'Invalid initData signature' });
  }

  // 解析用户信息并挂载到 request
  const user = parseInitData(initData);
  if (!user) {
    return res.status(401).json({ error: 'Cannot parse user from initData' });
  }

  // 将用户信息挂载到 request 对象上
  (req as any).telegramUser = user;
  (req as any).initData = initData;

  next();
}
