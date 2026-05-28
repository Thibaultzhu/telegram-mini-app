import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';

// 模拟商品数据（实际项目从后端 API 获取）
const MOCK_PRODUCTS = [
  { id: '1', name: 'VIP 月卡', description: '解锁所有高级功能 30 天', price: 100, image: '🏆' },
  { id: '2', name: '积分包 x500', description: '500 积分立即到账', price: 50, image: '💎' },
  { id: '3', name: '专属徽章', description: '限定收藏徽章', price: 30, image: '🎖️' },
  { id: '4', name: '加速卡', description: '任务完成速度 x2', price: 20, image: '⚡' },
  { id: '5', name: '幸运抽奖券', description: '参与每周大奖抽取', price: 10, image: '🎰' },
  { id: '6', name: '自定义主题', description: '个性化界面主题包', price: 40, image: '🎨' },
];

export function ShopPage() {
  const { cart, addToCart } = useAppStore();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (product: typeof MOCK_PRODUCTS[0]) => {
    addToCart(product);
    setAddedId(product.id);
    // 触觉反馈
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    setTimeout(() => setAddedId(null), 1000);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">商店</h1>
        {cartCount > 0 && (
          <span className="bg-tg-button text-tg-button-text text-xs font-bold px-2 py-1 rounded-full">
            🛒 {cartCount}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {MOCK_PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="bg-tg-secondary-bg rounded-xl p-4 flex items-center gap-4"
          >
            <span className="text-3xl">{product.image}</span>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{product.name}</h3>
              <p className="text-tg-hint text-xs mt-0.5">{product.description}</p>
            </div>
            <button
              onClick={() => handleAddToCart(product)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                addedId === product.id
                  ? 'bg-green-500 text-white'
                  : 'bg-tg-button text-tg-button-text'
              }`}
            >
              {addedId === product.id ? '✓ 已加' : `⭐ ${product.price}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
