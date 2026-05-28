import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // 开发环境使用 HTTPS（Telegram Mini App 强制要求）
    // 生产环境由部署平台自动处理
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
