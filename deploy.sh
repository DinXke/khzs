#!/bin/bash
set -e

REPO="https://github.com/DinXke/khzs.git"
DEPLOY_DIR="/khzs"

echo "=== KHZS Deploy ==="

if [ ! -d "$DEPLOY_DIR" ]; then
  git clone "$REPO" "$DEPLOY_DIR"
else
  cd "$DEPLOY_DIR"
  git pull origin main
fi

cd "$DEPLOY_DIR"
mkdir -p data public/uploads

docker compose down --remove-orphans || true
docker compose build --no-cache
docker compose up -d

echo "=== Deploy klaar ==="
echo "App draait op http://localhost:3000"
docker compose ps
