import { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

/**
 * TON 网络上的 USDT 合约地址
 * Mainnet: EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs
 * Testnet: kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy
 */
export const USDT_MASTER_ADDRESS = {
  mainnet: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  testnet: 'kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy',
};

// 你的收款钱包地址（替换为真实地址）
export const MERCHANT_WALLET = 'YOUR_MERCHANT_TON_WALLET_ADDRESS';

// 当前使用的网络
export const NETWORK: 'mainnet' | 'testnet' = 'testnet';

interface StablecoinPaymentProps {
  amount: number;       // USDT 金额（如 9.99）
  orderId: string;      // 订单 ID
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

/**
 * 稳定币支付组件
 * 支持 USDT on TON 支付
 *
 * 支付流程：
 * 1. 用户连接 TON 钱包（Tonkeeper/MyTonWallet/OpenMask 等）
 * 2. 构造 Jetton Transfer 消息（USDT 是 TON 上的 Jetton 代币）
 * 3. 用户在钱包中确认签名
 * 4. 交易广播到 TON 网络，约 0.6-6 秒确认
 * 5. 后端通过 webhook/轮询验证到账
 */
export function StablecoinPayment({ amount, orderId, onSuccess, onError }: StablecoinPaymentProps) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { webApp } = useTelegramWebApp();
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'signing' | 'confirming' | 'success' | 'error'>('idle');

  /**
   * 方案 A：使用 TON Pay SDK（推荐，最简方案）
   * 需要安装 @ton-pay/api @ton-pay/ui-react
   */
  const handleTonPayUSDT = async () => {
    if (!wallet) {
      setStatus('connecting');
      await tonConnectUI.openModal();
      return;
    }

    setIsPaying(true);
    setStatus('signing');

    try {
      // 调用后端创建支付订单，获取支付参数
      const response = await fetch('/api/payments/usdt/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          orderId,
          senderAddress: wallet.account.address,
        }),
      });
      const { transferMessage } = await response.json();

      // 发送 Jetton Transfer 交易
      // USDT 在 TON 上是 Jetton（类似 ERC-20），转账需要构造特定消息
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 分钟有效
        messages: [transferMessage],
      });

      setStatus('confirming');

      // 通知后端验证交易
      const verifyResponse = await fetch('/api/payments/usdt/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, boc: result.boc }),
      });
      const { verified } = await verifyResponse.json();

      if (verified) {
        setStatus('success');
        webApp?.HapticFeedback?.notificationOccurred('success');
        onSuccess?.(result.boc);
      } else {
        throw new Error('Transaction verification failed');
      }
    } catch (error: any) {
      setStatus('error');
      webApp?.HapticFeedback?.notificationOccurred('error');
      onError?.(error.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  /**
   * 方案 B：手动构造 Jetton Transfer 消息
   * 无需 TON Pay SDK，直接通过 TonConnect 发送
   * 适合不想依赖 TON Pay 的场景
   */
  const handleDirectJettonTransfer = async () => {
    if (!wallet) {
      await tonConnectUI.openModal();
      return;
    }

    setIsPaying(true);
    setStatus('signing');

    try {
      // 从后端获取用户的 USDT Jetton 钱包地址和转账参数
      const response = await fetch('/api/payments/usdt/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAddress: wallet.account.address,
          amount,
          orderId,
        }),
      });
      const { jettonWalletAddress, transferPayload, forwardTon } = await response.json();

      // 发送交易：向用户的 Jetton Wallet 合约发送 transfer 消息
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            // 目标地址是 **用户的** Jetton Wallet 合约地址
            // （不是 USDT Master，也不是收款人地址）
            address: jettonWalletAddress,
            // 附带的 TON 金额（用于 gas + forward），通常 0.05-0.1 TON
            amount: forwardTon || '100000000', // 0.1 TON in nanoton
            // Jetton Transfer 消息体（由后端构造）
            payload: transferPayload,
          },
        ],
      });

      setStatus('confirming');
      // 后续同方案 A：后端验证
      const verifyRes = await fetch('/api/payments/usdt/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, boc: result.boc }),
      });
      const { verified } = await verifyRes.json();

      if (verified) {
        setStatus('success');
        onSuccess?.(result.boc);
      }
    } catch (error: any) {
      setStatus('error');
      onError?.(error.message);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="bg-tg-secondary-bg rounded-xl p-4">
      <h3 className="font-medium text-sm mb-3">💵 USDT 稳定币支付</h3>

      {/* 钱包连接状态 */}
      {!wallet ? (
        <button
          onClick={() => tonConnectUI.openModal()}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-medium"
        >
          连接 TON 钱包
        </button>
      ) : (
        <div className="space-y-3">
          {/* 已连接钱包信息 */}
          <div className="flex items-center justify-between text-xs text-tg-hint">
            <span>钱包已连接</span>
            <span>{wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}</span>
          </div>

          {/* 支付金额 */}
          <div className="text-center py-2">
            <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
            <span className="text-tg-hint text-sm ml-1">USDT</span>
          </div>

          {/* 支付按钮 */}
          <button
            onClick={handleTonPayUSDT}
            disabled={isPaying}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 transition-all"
          >
            {status === 'signing' && '⏳ 请在钱包中确认...'}
            {status === 'confirming' && '⏳ 等待链上确认...'}
            {status === 'success' && '✅ 支付成功'}
            {status === 'error' && '❌ 支付失败，点击重试'}
            {(status === 'idle' || status === 'connecting') && `支付 $${amount.toFixed(2)} USDT`}
          </button>

          {/* 网络信息 */}
          <p className="text-center text-xs text-tg-hint">
            TON 网络 · 手续费 {'<'} $0.01 · 确认时间 ~5秒
          </p>
        </div>
      )}
    </div>
  );
}
