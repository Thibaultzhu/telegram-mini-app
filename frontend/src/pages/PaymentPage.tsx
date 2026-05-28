import { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useAppStore } from '../hooks/useAppStore';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { createStarsInvoice } from '../utils/api';

export function PaymentPage() {
  const { cart, getCartTotal, clearCart } = useAppStore();
  const { webApp, initData } = useTelegramWebApp();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [isPaying, setIsPaying] = useState(false);

  const total = getCartTotal();

  // Telegram Stars 支付
  const handleStarsPayment = async () => {
    if (!initData || total === 0) return;
    setIsPaying(true);
    try {
      const { invoiceLink } = await createStarsInvoice({
        title: '商品购买',
        description: `购买 ${cart.length} 件商品`,
        amount: total,
        payload: JSON.stringify({ items: cart.map(i => i.product.id) }),
        initData,
      });
      // 打开 Telegram 内置支付界面
      webApp?.openTelegramLink(invoiceLink);
      clearCart();
      webApp?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      webApp?.showAlert('支付失败，请重试');
      webApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setIsPaying(false);
    }
  };

  // TON 钱包支付
  const handleTonPayment = async () => {
    if (!wallet) {
      // 未连接钱包，触发连接
      await tonConnectUI.openModal();
      return;
    }
    setIsPaying(true);
    try {
      // 发送 TON 交易（示例：0.1 TON = 100000000 nanoton）
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 分钟有效
        messages: [
          {
            address: 'YOUR_MERCHANT_TON_ADDRESS', // 替换为你的收款地址
            amount: String(total * 1000000), // 转换为 nanoton
          },
        ],
      };
      await tonConnectUI.sendTransaction(transaction);
      clearCart();
      webApp?.HapticFeedback?.notificationOccurred('success');
      webApp?.showAlert('TON 支付成功！');
    } catch (error) {
      webApp?.showAlert('TON 支付失败');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">钱包 & 支付</h1>

      {/* TON 钱包连接状态 */}
      <div className="bg-tg-secondary-bg rounded-xl p-4 mb-4">
        <h2 className="font-medium text-sm mb-2">💎 TON 钱包</h2>
        {wallet ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-tg-hint">
              {wallet.account.address.slice(0, 8)}...{wallet.account.address.slice(-6)}
            </span>
            <button
              onClick={() => tonConnectUI.disconnect()}
              className="text-xs text-red-500"
            >
              断开连接
            </button>
          </div>
        ) : (
          <button
            onClick={() => tonConnectUI.openModal()}
            className="w-full py-2 bg-tg-button text-tg-button-text rounded-lg text-sm font-medium"
          >
            连接 TON 钱包
          </button>
        )}
      </div>

      {/* 购物车摘要 */}
      <div className="bg-tg-secondary-bg rounded-xl p-4 mb-4">
        <h2 className="font-medium text-sm mb-2">🛒 购物车</h2>
        {cart.length === 0 ? (
          <p className="text-tg-hint text-xs">购物车为空</p>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-xs py-1">
                <span>{item.product.name} × {item.quantity}</span>
                <span>⭐ {item.product.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 flex justify-between font-bold text-sm">
              <span>合计</span>
              <span>⭐ {total}</span>
            </div>
          </>
        )}
      </div>

      {/* 支付按钮 */}
      {cart.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={handleStarsPayment}
            disabled={isPaying}
            className="w-full py-3 bg-tg-button text-tg-button-text rounded-xl font-medium disabled:opacity-50"
          >
            {isPaying ? '处理中...' : `⭐ Stars 支付 (${total} Stars)`}
          </button>
          <button
            onClick={handleTonPayment}
            disabled={isPaying}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {isPaying ? '处理中...' : '💎 TON 支付'}
          </button>
        </div>
      )}
    </div>
  );
}
