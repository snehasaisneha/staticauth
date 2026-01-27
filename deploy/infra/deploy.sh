#!/bin/bash
# Deployment script - run after code updates
# Run as: bash deploy.sh

set -e

DEPLOY_DIR="/home/ubuntu/deploy"
STATICAUTH_DIR="$DEPLOY_DIR/staticauth"
INFRA_DIR="$DEPLOY_DIR/infra"
BACKUP_DIR="$INFRA_DIR/backups"

echo "=== Deploying StaticAuth ==="

cd "$STATICAUTH_DIR"

# Backup database before deployment
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if [ -f staticauth.db ]; then
    echo "Backing up database..."
    cp staticauth.db "$BACKUP_DIR/staticauth_$TIMESTAMP.db"
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/staticauth_*.db 2>/dev/null | tail -n +11 | xargs -r rm
fi

# Copy .env from infra
echo "Copying environment file..."
cp "$INFRA_DIR/.env-staticauth" "$STATICAUTH_DIR/.env"

# Install/update Python dependencies
echo "Installing Python dependencies..."
uv sync

# Run migrations
echo "Running migrations..."
uv run all-migrations

# Build frontend
echo "Building frontend..."
cd "$STATICAUTH_DIR/frontend"
npm install
npm run build

# Restart backend service
echo "Restarting staticauth service..."
sudo systemctl restart staticauth

# Wait for service to start
sleep 2

# Check service status
if sudo systemctl is-active --quiet staticauth; then
    echo "StaticAuth service is running"
else
    echo "ERROR: StaticAuth service failed to start"
    sudo journalctl -u staticauth --no-pager -n 20
    exit 1
fi

# Reload nginx to pick up any config changes
sudo systemctl reload nginx

echo ""
echo "=== Deployment complete ==="
echo "API: http://localhost:8000/api/v1"
echo "Frontend: http://localhost:4321"
echo "Docs: http://localhost:3000"
