#!/bin/bash
# AI Companion — 活动追踪代理一键设置
set -e

echo "🤖 AI Companion — 活动追踪代理设置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# 1. 编译 C helper（空闲检测，比 Python/osascript 快 10x）
echo "🔧 编译空闲检测 helper..."
if command -v gcc &> /dev/null; then
  gcc -O2 -o "$SCRIPT_DIR/idle_helper" "$SCRIPT_DIR/idle.c" \
    -framework CoreGraphics -framework Foundation 2>/dev/null && \
    echo "   ✅ idle_helper 编译成功" || \
    echo "   ⚠️  编译失败，将使用 ioreg 备用方案"
elif command -v clang &> /dev/null; then
  clang -O2 -o "$SCRIPT_DIR/idle_helper" "$SCRIPT_DIR/idle.c" \
    -framework CoreGraphics -framework Foundation 2>/dev/null && \
    echo "   ✅ idle_helper 编译成功" || \
    echo "   ⚠️  编译失败，将使用 ioreg 备用方案"
else
  echo "   ⚠️  未找到编译器，跳过（将使用 ioreg 备用方案）"
fi

# 2. 检查 Node.js
echo ""
echo "📦 检查 Node.js..."
node --version

# 3. 创建数据目录
echo ""
echo "💾 创建数据目录..."
mkdir -p "$HOME/.ai-companion"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 设置完成！"
echo ""
echo "🚀 启动追踪代理:"
echo ""
echo "   # 前台运行（看日志）"
echo "   node src/agent/tracker.js"
echo ""
echo "   # 后台守护"
echo "   nohup node src/agent/tracker.js > /tmp/ai-companion-tracker.log 2>&1 &"
echo ""
echo "   # 查看状态"
echo "   node src/agent/tracker.js --status"
echo ""
echo "   # 停止"
echo "   node src/agent/tracker.js --stop"
echo ""
echo "⚠️  启动前请设置:"
echo "   export AI_COMPANION_API_URL=http://localhost:3000/api/v1/activity"
echo "   export AI_COMPANION_TOKEN=<supabase-access-token>"
echo ""
echo "💡 获取 token: 浏览器登录后，DevTools > Application > Local Storage"
echo "   找到 sb-<project>-auth-token，复制 access_token 字段"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
