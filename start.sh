#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🚀 正在启动 PanTools 网盘转存工具..."
echo "📁 目录: $(pwd)"
echo "🌿 Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
echo "🧩 Commit: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo ""

echo "📦 检查依赖..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "📦 安装依赖..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install
  else
    npm install
  fi
fi

echo "🌐 检查 Playwright Chromium..."
unset PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
if command -v npx >/dev/null 2>&1; then
  timeout 120s npx playwright install chromium >/tmp/pantools-playwright.log 2>&1 || true
fi

echo "🧹 清理旧的本地服务进程..."
if command -v pkill >/dev/null 2>&1; then
  pkill -f "node server.js" || true
fi

echo "▶️ 启动当前仓库的 server.js ..."
nohup node server.js > pantools.log 2>&1 &
sleep 3

echo "🔍 健康检查..."
if command -v curl >/dev/null 2>&1 && curl -fsS http://localhost:3000/api/health >/tmp/pantools-health.json; then
  cat /tmp/pantools-health.json
  echo ""
  echo "✅ 服务启动成功"
  echo "📝 日志文件: $(pwd)/pantools.log"
  echo "🌐 访问地址: http://localhost:3000"
else
  echo "❌ 服务启动失败，请查看 pantools.log"
  echo "--- playwright log ---"
  cat /tmp/pantools-playwright.log 2>/dev/null || true
  echo "--- server log ---"
  cat pantools.log 2>/dev/null || true
  if grep -q "Executable doesn't exist" pantools.log 2>/dev/null; then
    echo ""
    echo "⚠️ Playwright 浏览器未安装成功，请手动执行："
    echo "   npx playwright install chromium"
  fi
  exit 1
fi
