import crypto from 'crypto';

/**
 * 验证 Telegram Mini App 的 initData
 * 使用 HMAC-SHA256 验证签名，确保数据来自 Telegram
 *
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    // 移除 hash 后按字母序排列
    params.delete('hash');
    const entries = Array.from(params.entries());
    entries.sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join('\n');

    // 用 Bot Token 生成 secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // 验证签名
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return computedHash === hash;
  } catch {
    return false;
  }
}

/**
 * 从 initData 中解析用户信息
 */
export function parseInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    return {
      id: user.id as number,
      firstName: user.first_name as string,
      lastName: user.last_name as string | undefined,
      username: user.username as string | undefined,
      languageCode: user.language_code as string | undefined,
      isPremium: user.is_premium as boolean | undefined,
    };
  } catch {
    return null;
  }
}
