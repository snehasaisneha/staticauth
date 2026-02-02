# Deployment

Configuration files for deploying Gatekeeper in production.

```
deployment/
├── nginx/           # Nginx configuration
│   ├── gatekeeper.conf      # Serves Gatekeeper frontend + API
│   ├── protected-app.conf   # Template for protected apps
│   └── README.md
├── systemd/         # Systemd service
│   ├── gatekeeper.service
│   └── README.md
└── README.md        # This file
```

## Quick Deploy

### 1. Install Gatekeeper

```bash
# Clone and install
git clone https://github.com/snehasaisneha/gatekeeper.git /opt/gatekeeper
cd /opt/gatekeeper
cp .env.example .env
nano .env  # Configure your settings

# Install dependencies and run migrations
uv sync
uv run all-migrations

# Create first admin user
uv run gk users add --email admin@example.com --admin --seeded
```

### 2. Set up Systemd

```bash
# Edit service file (change paths)
nano deployment/systemd/gatekeeper.service

# Install and start
sudo cp deployment/systemd/gatekeeper.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gatekeeper

# Verify it's running
sudo systemctl status gatekeeper
```

### 3. Set up Nginx

```bash
# Gatekeeper itself
sudo cp deployment/nginx/gatekeeper.conf /etc/nginx/sites-available/auth.example.com
sudo nano /etc/nginx/sites-available/auth.example.com  # Edit variables at top
sudo ln -s /etc/nginx/sites-available/auth.example.com /etc/nginx/sites-enabled/

# Get SSL
sudo certbot --nginx -d auth.example.com

# Reload
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Protect an App

```bash
# Copy template
sudo cp deployment/nginx/protected-app.conf /etc/nginx/sites-available/docs.example.com
sudo nano /etc/nginx/sites-available/docs.example.com  # Edit variables at top
sudo ln -s /etc/nginx/sites-available/docs.example.com /etc/nginx/sites-enabled/
sudo certbot --nginx -d docs.example.com
sudo nginx -t && sudo systemctl reload nginx

# Register in Gatekeeper
uv run gk apps add --slug docs --name "Documentation"
uv run gk apps grant --slug docs --email admin@example.com
```

## Detailed Guides

- [Nginx Configuration](nginx/README.md) - Full nginx setup, SSL, caching
- [Systemd Service](systemd/README.md) - Service management, logs, troubleshooting
