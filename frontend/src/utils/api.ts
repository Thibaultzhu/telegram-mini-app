const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  initData?: string;
}

/**
 * 通用 API 请求工具
 * 自动携带 Telegram initData 用于服务端验证
 */
export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, initData } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 将 initData 放在 Authorization header 中，服务端用于验证用户身份
  if (initData) {
    headers['Authorization'] = `tma ${initData}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 验证用户身份（首次打开时调用）
 */
export async function authenticateUser(initData: string) {
  return apiRequest<{ user: { id: number; username: string }; token: string }>(
    '/auth/telegram',
    { method: 'POST', body: { initData } }
  );
}

/**
 * 创建 Telegram Stars 支付发票
 */
export async function createStarsInvoice(params: {
  title: string;
  description: string;
  amount: number; // Stars 数量
  payload: string;
  initData: string;
}) {
  return apiRequest<{ invoiceLink: string }>(
    '/payments/stars/create-invoice',
    { method: 'POST', body: params, initData: params.initData }
  );
}

/**
 * 获取商品列表
 */
export async function getProducts(initData: string) {
  return apiRequest<{ products: Array<{ id: string; name: string; description: string; price: number; image?: string }> }>(
    '/products',
    { initData }
  );
}
