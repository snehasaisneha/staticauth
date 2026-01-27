#!/bin/bash
# First-time setup script for docs server (172.26.1.196)
# Run as: sudo bash setup.sh

set -e

echo "=== StaticAuth + Docs Server Setup ==="

# Install dependencies
echo "Installing system dependencies..."
apt-get update
apt-get install -y nginx python3.12 python3.12-venv nodejs npm

# Install uv for ubuntu user
echo "Installing uv..."
su - ubuntu -c "curl -LsSf https://astral.sh/uv/install.sh | sh"

# Create deploy directory structure
echo "Setting up directory structure..."
mkdir -p /home/ubuntu/deploy/infra/backups
chown -R ubuntu:ubuntu /home/ubuntu/deploy

# Copy nginx config
echo "Configuring nginx..."
cp /home/ubuntu/deploy/infra/nginx-docs-server.conf /etc/nginx/sites-available/enggdocs
ln -sf /etc/nginx/sites-available/enggdocs /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Copy systemd service
echo "Setting up systemd service..."
cp /home/ubuntu/deploy/infra/staticauth.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable staticauth

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "1. Copy .env-staticauth to /home/ubuntu/deploy/staticauth/.env"
echo "2. Run: cd /home/ubuntu/deploy/staticauth && uv sync && uv run all-migrations"
echo "3. Build frontend: cd frontend && npm install && npm run build"
echo "4. Start services: sudo systemctl start staticauth && sudo systemctl reload nginx"
echo "5. Check status: sudo systemctl status staticauth"
