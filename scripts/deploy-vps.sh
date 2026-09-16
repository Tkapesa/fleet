#!/usr/bin/env bash
# Run ON the VPS as root (after git push):
#   cd /var/www/atondafleet && bash scripts/deploy-vps.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/atondafleet}"
BRANCH="${BRANCH:-feature/frontend}"
API_URL="${VITE_API_BASE_URL:-https://atondafleet.com/api}"

echo "==> Deploy AtondaFleet frontend"
echo "    dir:    $APP_DIR"
echo "    branch: $BRANCH"
echo "    api:    $API_URL"

cd "$APP_DIR"

if [ ! -d .git ]; then
  echo "ERROR: $APP_DIR is not a git repo. Clone first:"
  echo "  git clone https://github.com/Tkapesa/fleet.git $APP_DIR"
  echo "  cd $APP_DIR && git checkout $BRANCH"
  exit 1
fi

git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

cd frontend
npm ci
VITE_BASE_PATH=/ VITE_API_BASE_URL="$API_URL" npm run build

echo "==> Build OK: $APP_DIR/frontend/dist"
echo "    Reload nginx: sudo nginx -t && sudo systemctl reload nginx"
