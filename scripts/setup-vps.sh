#!/usr/bin/env bash
# First-time VPS setup for atondafleet.com (run as root on 13.140.190.204)
set -euo pipefail

APP_DIR=/var/www/atondafleet
REPO=https://github.com/Tkapesa/fleet.git
BRANCH=feature/frontend

echo "==> Install Node 22 if missing"
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> Clone or update repo"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
else
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

bash "$APP_DIR/scripts/deploy-vps.sh"

echo "==> Install nginx site"
cp "$APP_DIR/deploy/nginx/atondafleet.com.conf" /etc/nginx/sites-available/atondafleet.com
ln -sf /etc/nginx/sites-available/atondafleet.com /etc/nginx/sites-enabled/atondafleet.com
nginx -t
systemctl reload nginx

echo "==> Done. Point DNS A record atondafleet.com -> this server IP, then:"
echo "    certbot --nginx -d atondafleet.com -d www.atondafleet.com"
