interface HomePageProps {
  user: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; is_premium?: boolean } | null;
}

export function HomePage({ user }: HomePageProps) {
  return (
    <div className="p-4">
      {/* 欢迎区域 */}
      <div className="bg-tg-secondary-bg rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt="avatar"
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-tg-button flex items-center justify-center text-tg-button-text text-xl font-bold">
              {user?.first_name?.[0] || '?'}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold">
              你好, {user?.first_name || 'Guest'} 👋
            </h1>
            <p className="text-tg-hint text-sm">
              {user?.is_premium ? '⭐ Premium 会员' : '欢迎回来'}
            </p>
          </div>
        </div>
      </div>

      {/* 功能卡片 */}
      <h2 className="text-base font-semibold mb-3">功能</h2>
      <div className="grid grid-cols-2 gap-3">
        <FeatureCard
          icon="🛍️"
          title="商品浏览"
          description="发现优质数字商品"
        />
        <FeatureCard
          icon="⭐"
          title="Stars 支付"
          description="一键购买，即刻到账"
        />
        <FeatureCard
          icon="💎"
          title="TON 钱包"
          description="连接钱包，链上支付"
        />
        <FeatureCard
          icon="🎁"
          title="任务奖励"
          description="完成任务赚取积分"
        />
      </div>

      {/* 公告 */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <p className="text-sm text-tg-text">
          📢 <strong>公告：</strong>新用户注册即送 100 积分！完成每日任务还可额外获得奖励。
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-tg-secondary-bg rounded-xl p-4 active:scale-95 transition-transform cursor-pointer">
      <span className="text-2xl">{icon}</span>
      <h3 className="font-medium mt-2 text-sm">{title}</h3>
      <p className="text-tg-hint text-xs mt-1">{description}</p>
    </div>
  );
}
