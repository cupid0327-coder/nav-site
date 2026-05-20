#!/usr/bin/env bash
# 服务器一键升级脚本
#   用法：在仓库根目录执行   bash deploy/update.sh
#   行为：
#     1. git pull
#     2. npm ci && npm run build
#     3. 备份 .next/standalone/.env（build 会重建 standalone 目录，env 会丢）
#     4. 复制 public/ 和 .next/static/ 到 standalone，保留服务器已有的 uploads
#     5. 还原 .env，pm2 restart

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
STANDALONE="$ROOT/.next/standalone"
ENV_BACKUP="/tmp/nav-site.standalone.env.$(date +%s)"
PM2_APP="${PM2_APP:-n_site}"

echo "==> [1/6] git pull"
git pull --ff-only

echo "==> [2/6] npm ci"
npm ci

echo "==> [3/6] 备份当前 .next/standalone/.env -> $ENV_BACKUP"
if [ -f "$STANDALONE/.env" ]; then
  cp "$STANDALONE/.env" "$ENV_BACKUP"
  echo "    已备份"
else
  echo "    (没有现存 .env，跳过)"
  ENV_BACKUP=""
fi

echo "==> [4/6] npm run build"
npm run build

echo "==> [5/6] 同步 public/ 和 .next/static/ 到 standalone"
# uploads 里有运行时写入的 favicon，必须保留服务器侧版本
mkdir -p "$STANDALONE/public" "$STANDALONE/.next"
rsync -a --delete --exclude='uploads' public/ "$STANDALONE/public/"
rsync -a --delete .next/static/ "$STANDALONE/.next/static/"
# uploads 目录如果服务器上没有就建一个空的（首次部署场景）
mkdir -p "$STANDALONE/public/uploads/icons"

echo "==> [6/6] 还原 .env 并重启 pm2"
if [ -n "$ENV_BACKUP" ]; then
  cp "$ENV_BACKUP" "$STANDALONE/.env"
  echo "    已还原 .env"
else
  echo "    !! 警告：没有 .env 备份，请手动检查 $STANDALONE/.env"
  echo "    !! 至少需要：DATABASE_URL (绝对路径)、AUTH_SECRET、AUTH_TRUST_HOST、AUTH_URL"
fi

pm2 restart "$PM2_APP"
sleep 2
pm2 logs "$PM2_APP" --lines 15 --nostream || true

echo ""
echo "✓ 升级完成。备份保留在 $ENV_BACKUP（如不需要可手动删除）"
