import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

interface ProfilePageProps {
  user: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; is_premium?: boolean } | null;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const { platform, colorScheme } = useTelegramWebApp();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">个人中心</h1>

      {/* 用户信息卡片 */}
      <div className="bg-tg-secondary-bg rounded-xl p-6 text-center mb-4">
        {user?.photo_url ? (
          <img
            src={user.photo_url}
            alt="avatar"
            className="w-20 h-20 rounded-full mx-auto mb-3"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-tg-button flex items-center justify-center text-tg-button-text text-2xl font-bold mx-auto mb-3">
            {user?.first_name?.[0] || '?'}
          </div>
        )}
        <h2 className="font-bold text-lg">
          {user?.first_name} {user?.last_name || ''}
        </h2>
        {user?.username && (
          <p className="text-tg-hint text-sm">@{user.username}</p>
        )}
        {user?.is_premium && (
          <span className="inline-block mt-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
            ⭐ Telegram Premium
          </span>
        )}
      </div>

      {/* 账户信息 */}
      <div className="bg-tg-secondary-bg rounded-xl overflow-hidden">
        <InfoRow label="Telegram ID" value={String(user?.id || '-')} />
        <InfoRow label="平台" value={platform} />
        <InfoRow label="主题模式" value={colorScheme === 'dark' ? '深色' : '浅色'} />
        <InfoRow label="会员状态" value={user?.is_premium ? 'Premium' : '普通用户'} isLast />
      </div>

      {/* 设置列表 */}
      <div className="mt-4 bg-tg-secondary-bg rounded-xl overflow-hidden">
        <SettingRow icon="🔔" label="通知设置" />
        <SettingRow icon="🌐" label="语言" value="中文" />
        <SettingRow icon="📋" label="订单历史" />
        <SettingRow icon="❓" label="帮助与反馈" isLast />
      </div>
    </div>
  );
}

function InfoRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div className={`flex justify-between items-center px-4 py-3 ${!isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
      <span className="text-tg-hint text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function SettingRow({ icon, label, value, isLast = false }: { icon: string; label: string; value?: string; isLast?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 active:bg-gray-100 dark:active:bg-gray-800 cursor-pointer ${!isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="flex items-center gap-3">
        <span>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {value && <span className="text-tg-hint text-xs">{value}</span>}
        <span className="text-tg-hint">›</span>
      </div>
    </div>
  );
}
