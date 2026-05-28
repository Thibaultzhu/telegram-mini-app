#!/bin/bash
# ============================================
# Telegram Mini App 一键启动脚本
# ============================================

set -e

echo "🚀 Telegram Mini App 开发环境启动"
echo "=================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 需要安装 Node.js 20+"
    echo "   安装: brew install node"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本需要 >= 18，当前: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# 检查后端环境变量
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "⚠️  后端 .env 文件不存在"
    echo "   执行: cp backend/.env.example backend/.env"
    echo "   然后编辑 backend/.env 填入你的 BOT_TOKEN"
    cp backend/.env.example backend/.env
    echo "   已自动复制模板，请编辑填入真实值"
fi

# 安装前端依赖
echo ""
echo "📦 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install --registry=https://registry.npmmirror.com
fi
cd ..

# 安装后端依赖
echo ""
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install --registry=https://registry.npmmirror.com
fi
cd ..

echo ""
echo "=================================="
echo "✅ 环境准备完成！"
echo ""
echo "启动开发服务器："
echo ""
echo "  终端 1 (后端):"
echo "    cd backend && npm run dev"
echo ""
echo "  终端 2 (前端):"
echo "    cd frontend && npm run dev"
echo ""
echo "  终端 3 (HTTPS 隧道，选一种):"
echo "    ngrok http 5173"
echo "    # 或"
echo "    cloudflared tunnel --url http://localhost:5173"
echo ""
echo "然后去 @BotFather 设置 Mini App URL 为隧道地址"
echo "=================================="
