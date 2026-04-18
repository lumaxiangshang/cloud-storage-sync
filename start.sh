#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🚀 正在启动 PanTools 网盘转存工具..."
echo "📁 目录: $(pwd)"
echo "🌿 Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
echo "🧩 Commit: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo ""

if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
fi

echo "🌐 检查 Playwright Chromium..."
npx playwright install chromium >/dev/null 2>&1 || true

echo "🧹 清理旧的本地服务进程..."
pkill -f "node server.js" || true

echo "▶️ 启动当前仓库的 server.js ..."
nohup node server.js > pantools.log 2>&1 &
sleep 2

echo "🔍 健康检查..."
if curl -fsS http://localhost:3000/api/health >/tmp/pantools-health.json; then
  cat /tmp/pantools-health.json
  echo ""
  echo "✅ 服务启动成功"
  echo "📝 日志文件: $(pwd)/pantools.log"
  echo "🌐 访问地址: http://localhost:3000"
else
  echo "❌ 服务启动失败，请查看 pantools.log"
  exit 1
fi
