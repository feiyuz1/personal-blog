#!/usr/bin/env bash
# 服务器端部署脚本：在服务器上运行（服务器目录 /home/ubuntu/apps/blog-app）
# 用法: ./scripts/deploy-server.sh [--skip-install]
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> 拉取最新代码"
git pull --ff-only

if [[ "${1:-}" != "--skip-install" ]]; then
  echo "==> 安装依赖"
  npm install
fi

echo "==> 应用数据库变更（如有）"
npx prisma migrate deploy

echo "==> 构建"
npm run build

echo "==> 重启服务"
sudo systemctl restart blog-app.service

echo "==> 检查服务状态"
sleep 2
sudo systemctl status blog-app.service --no-pager -l | head -15

echo "==> 部署完成 ✓  回滚方式: git revert 或 git reset 后重跑本脚本"
