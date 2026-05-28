import { Router, Request, Response } from 'express';
import { telegramAuth } from '../middleware/auth.js';

export const productsRouter = Router();

// 模拟商品数据（生产环境从数据库读取）
const PRODUCTS = [
  { id: '1', name: 'VIP 月卡', description: '解锁所有高级功能 30 天', price: 100, image: '🏆', category: 'subscription' },
  { id: '2', name: '积分包 x500', description: '500 积分立即到账', price: 50, image: '💎', category: 'credits' },
  { id: '3', name: '专属徽章', description: '限定收藏徽章', price: 30, image: '🎖️', category: 'collectible' },
  { id: '4', name: '加速卡', description: '任务完成速度 x2', price: 20, image: '⚡', category: 'boost' },
  { id: '5', name: '幸运抽奖券', description: '参与每周大奖抽取', price: 10, image: '🎰', category: 'lottery' },
  { id: '6', name: '自定义主题', description: '个性化界面主题包', price: 40, image: '🎨', category: 'cosmetic' },
];

/**
 * GET /api/products
 * 获取商品列表
 */
productsRouter.get('/', telegramAuth, (_req: Request, res: Response) => {
  res.json({ products: PRODUCTS });
});

/**
 * GET /api/products/:id
 * 获取单个商品详情
 */
productsRouter.get('/:id', telegramAuth, (req: Request, res: Response) => {
  const product = PRODUCTS.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product });
});
