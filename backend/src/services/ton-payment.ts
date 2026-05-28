/**
 * TON Jetton (USDT) 支付服务
 *
 * 核心概念：
 * - Jetton Master: 代币的主合约，管理总供应量和元数据
 * - Jetton Wallet: 每个用户对每种代币有一个独立的钱包合约
 * - Transfer: 向自己的 Jetton Wallet 发送消息，指示它将代币转给接收方
 *
 * USDT on TON 地址:
 * - Mainnet Master: EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs
 * - Testnet Master: kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy
 */

// ============================================================
// 注意：以下代码需要安装 @ton/core @ton/crypto @ton/ton 包
// npm install @ton/core @ton/crypto @ton/ton
// ============================================================

/**
 * 获取用户的 Jetton Wallet 地址
 *
 * 每个用户对每种 Jetton 都有一个独立的钱包合约。
 * 这个地址是通过 Jetton Master 合约的 get 方法计算得出的。
 *
 * @param jettonMasterAddress - Jetton Master 合约地址（如 USDT Master）
 * @param ownerAddress - 用户的 TON 钱包地址
 * @returns 用户的 Jetton Wallet 合约地址
 */
export async function getJettonWalletAddress(
  jettonMasterAddress: string,
  ownerAddress: string
): Promise<string> {
  // 方式 1: 通过 TON API 查询（推荐，无需运行完整节点）
  // GET https://tonapi.io/v2/accounts/{ownerAddress}/jettons/{jettonMasterAddress}
  //
  // 方式 2: 通过 TON Center API
  // POST https://toncenter.com/api/v2/runGetMethod
  //   address: jettonMasterAddress
  //   method: "get_wallet_address"
  //   stack: [["tvm.Slice", ownerAddress]]
  //
  // 方式 3: 使用 @ton/ton SDK（完整方式）
  //
  // import { TonClient, Address } from '@ton/ton';
  // import { JettonMaster } from '@ton/ton';
  //
  // const client = new TonClient({
  //   endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  //   apiKey: process.env.TON_API_KEY,
  // });
  //
  // const master = client.open(
  //   JettonMaster.create(Address.parse(jettonMasterAddress))
  // );
  // const walletAddress = await master.getWalletAddress(Address.parse(ownerAddress));
  // return walletAddress.toString();

  // 临时实现：通过 TON API HTTP 调用
  const apiBase = process.env.NODE_ENV === 'production'
    ? 'https://tonapi.io'
    : 'https://testnet.tonapi.io';

  const response = await fetch(
    `${apiBase}/v2/blockchain/accounts/${jettonMasterAddress}/methods/get_wallet_address`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        args: [ownerAddress],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get jetton wallet address: ${response.status}`);
  }

  const data = await response.json();
  // 解析返回的地址
  return data.decoded?.jetton_wallet_address || '';
}

/**
 * 构造 Jetton Transfer 消息体
 *
 * Jetton Transfer 消息格式 (TL-B):
 * transfer#0f8a7ea5 query_id:uint64 amount:(VarUInteger 16)
 *   destination:MsgAddress response_destination:MsgAddress
 *   custom_payload:(Maybe ^Cell) forward_ton_amount:(VarUInteger 16)
 *   forward_payload:(Either Cell ^Cell) = InternalMsgBody;
 *
 * @param params.jettonAmount - 转账金额（最小单位，USDT = 6位小数，所以 1 USDT = 1000000）
 * @param params.toAddress - 接收方的 TON 钱包地址
 * @param params.responseAddress - 回调通知地址（通常是发送方自己）
 * @param params.forwardPayload - 转发给接收方的附加数据（如订单 ID）
 */
export function buildJettonTransferPayload(params: {
  jettonAmount: bigint;
  toAddress: string;
  responseAddress: string;
  forwardPayload?: string;
}): string {
  // 使用 @ton/core 构造 Cell
  //
  // import { beginCell, Address, toNano } from '@ton/core';
  //
  // const body = beginCell()
  //   .storeUint(0x0f8a7ea5, 32)           // transfer op code
  //   .storeUint(0, 64)                     // query_id
  //   .storeCoins(params.jettonAmount)      // 转账金额
  //   .storeAddress(Address.parse(params.toAddress))      // 接收方
  //   .storeAddress(Address.parse(params.responseAddress)) // 回调地址
  //   .storeBit(false)                      // custom_payload = null
  //   .storeCoins(toNano('0.01'))           // forward_ton_amount
  //   .storeBit(true)                       // forward_payload 存在
  //   .storeRef(
  //     beginCell()
  //       .storeUint(0, 32)                 // text comment prefix
  //       .storeStringTail(params.forwardPayload || '')
  //       .endCell()
  //   )
  //   .endCell();
  //
  // return body.toBoc().toString('base64');

  // 临时返回占位符（安装 @ton/core 后替换上面的代码）
  return '';
}

/**
 * 验证 Jetton Transfer 交易
 *
 * 验证流程：
 * 1. 解析 BOC（Bag of Cells）获取交易信息
 * 2. 确认接收方是我们的商户地址
 * 3. 确认金额正确
 * 4. 确认 forward_payload 中的订单 ID 匹配
 * 5. 确认交易已在链上确认
 */
export async function verifyJettonTransfer(params: {
  boc: string;
  expectedRecipient: string;
  expectedOrderId: string;
}): Promise<boolean> {
  try {
    // 方式 1: 通过 TON Pay SDK 查询（如果使用了 TON Pay）
    // import { getTonPayTransferByReference } from '@ton-pay/api';
    // const status = await getTonPayTransferByReference(reference);
    // return status.status === 'completed';

    // 方式 2: 通过 TON API 监听 Jetton 转入
    // 查询商户 Jetton Wallet 的最近交易，匹配 comment
    const apiBase = process.env.NODE_ENV === 'production'
      ? 'https://tonapi.io'
      : 'https://testnet.tonapi.io';

    // 获取商户的 USDT 接收记录
    const merchantJettonWallet = await getJettonWalletAddress(
      process.env.USDT_MASTER_ADDRESS!,
      params.expectedRecipient
    );

    const response = await fetch(
      `${apiBase}/v2/blockchain/accounts/${merchantJettonWallet}/transactions?limit=10`
    );
    const data = await response.json();

    // 在最近的交易中查找匹配的订单 ID
    for (const tx of data.transactions || []) {
      // 检查 forward_payload 中是否包含我们的 orderId
      if (tx.in_msg?.decoded_body?.forward_payload?.value?.includes(params.expectedOrderId)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Verify jetton transfer error:', error);
    return false;
  }
}

/**
 * 监听商户钱包的 USDT 入账（轮询方式）
 * 
 * 生产环境建议：
 * - 使用 TON Pay 的 webhook 通知（零延迟）
 * - 或使用 tonapi.io 的 SSE streaming API
 * - 轮询仅作为 fallback
 */
export async function pollForPayment(orderId: string, timeoutMs: number = 120000): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 3000; // 每 3 秒查一次

  while (Date.now() - startTime < timeoutMs) {
    const verified = await verifyJettonTransfer({
      boc: '',
      expectedRecipient: process.env.TON_MERCHANT_ADDRESS!,
      expectedOrderId: orderId,
    });

    if (verified) return true;

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return false;
}
