import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { PaymentPage } from './pages/PaymentPage';
import { ProfilePage } from './pages/ProfilePage';
import { Navigation } from './components/Navigation';

// TON Connect manifest URL（部署后替换为你的域名）
const TON_CONNECT_MANIFEST = 'https://your-domain.com/tonconnect-manifest.json';

export function App() {
  const { webApp, user } = useTelegramWebApp();

  useEffect(() => {
    if (webApp) {
      // 通知 Telegram 客户端 Mini App 已准备就绪
      webApp.ready();
      // 展开 Mini App 到全屏高度
      webApp.expand();
    }
  }, [webApp]);

  return (
    <TonConnectUIProvider manifestUrl={TON_CONNECT_MANIFEST}>
      <BrowserRouter>
        <div className="min-h-screen bg-tg-bg text-tg-text pb-20">
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/profile" element={<ProfilePage user={user} />} />
          </Routes>
          <Navigation />
        </div>
      </BrowserRouter>
    </TonConnectUIProvider>
  );
}
