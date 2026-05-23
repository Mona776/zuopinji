#!/bin/bash
cd "$(dirname "$0")"

echo "正在启动 MONA.EXE 本地预览（stitch）…"

if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js，请先安装：https://nodejs.org"
  read -p "按回车键关闭…"
  exit 1
fi

STITCH_DIR="stitch/Vibe Coding Lab"
PORT=4321

if lsof -i :"$PORT" >/dev/null 2>&1; then
  echo "重启 ${PORT} 端口上的预览服务…"
  kill $(lsof -t -i :"$PORT") 2>/dev/null || true
  sleep 1
fi
npx --yes serve "$STITCH_DIR" -l "$PORT" &
sleep 2

open "http://127.0.0.1:${PORT}/home/"
echo "已在浏览器打开: http://127.0.0.1:${PORT}/home/"
echo "（旧版 site 预览: npm run dev:site → http://127.0.0.1:4322/）"
echo "关闭本窗口不会停止预览服务。"
echo "停止服务: lsof -i :${PORT} 然后 kill 对应 PID"
read -p "按回车键关闭本窗口…"
