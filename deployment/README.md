# Deployment

Production deployment configuration for Gatekeeper.

## Architecture

```
                              Internet
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│                     Nginx (Port 80/443)                        │
│                     - SSL termination                          │
│                     - Routes by subdomain                      │
└────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
         ▼                                               ▼
┌─────────────────────┐                   ┌─────────────────────┐
│ auth.example.com    │                   │ docs.example.com    │
│ (Gatekeeper)        │                   │ (Protected App)     │
│                     │                   │                     │
│ NO AUTH REQUIRED    │◄──────────────────│ auth_request ───────┤
│ - Frontend (static) │   validate        │ validates session   │
│ - API (FastAPI)     │   session         │ before proxying     │
└─────────────────────┘                   └─────────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────────┐                   ┌─────────────────────┐
│ localhost:8000      │                   │ localhost:3000      │
│ Gatekeeper Backend  │                   │ Your App Backend    │
└─────────────────────┘                   └─────────────────────┘
```

## Directory Structure

```
deployment/
├── nginx/
│   ├── routing.conf        # Main routing (SSL, HTTP→HTTPS, subdomains)
│   ├── gatekeeper.conf     # Gatekeeper frontend + API (NO auth)
│   ├── protected-app.conf  # Template for protected apps (WITH auth)
│   └── README.md           # Detailed nginx documentation
├── systemd/
│   ├── gatekeeper.service  # Systemd service file
│   └── README.md
└── README.md               # This file
```

## Quick Deploy

### 1. Install Gatekeeper

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/gatekeeper.git /opt/gatekeeper
cd /opt/gatekeeper

# Configure
cp .env.example .env
nano .env
# Set at minimum:
#   SECRET_KEY=<random-32+-char-string>
#   COOKIE_DOMAIN=.example.com
#   FRONTEND_URL=https://auth.example.com
#   APP_URL=https://auth.example.com

# Install dependencies
uv sync

# Build frontend
npm -C frontend install
npm -C frontend run build

# Run migrations
uv run gk ops migrate  # or: uv run all-migrations

# Create admin user
uv run gk users add --email admin@example.com --admin --seeded
```

### 2. Set Up Systemd Service

```bash
# Edit service file (update paths if needed)
nano deployment/systemd/gatekeeper.service

# Install
sudo cp deployment/systemd/gatekeeper.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gatekeeper

# Verify
sudo systemctl status gatekeeper
journalctl -u gatekeeper -f  # View logs
```

### 3. Set Up Nginx

```bash
# Copy configs
sudo cp deployment/nginx/gatekeeper.conf /etc/nginx/sites-available/auth.example.com
sudo cp deployment/nginx/protected-app.conf /etc/nginx/sites-available/docs.example.com

# Edit configs (update domains, paths, SSL certs)
sudo nano /etc/nginx/sites-available/auth.example.com
sudo nano /etc/nginx/sites-available/docs.example.com

# Enable
sudo ln -s /etc/nginx/sites-available/auth.example.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/docs.example.com /etc/nginx/sites-enabled/

# Get SSL certificates
sudo certbot --nginx -d auth.example.com -d docs.example.com
# Or wildcard: sudo certbot certonly --manual -d "*.example.com" -d example.com

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Register Your App in Gatekeeper

```bash
# Add the app
uv run gk apps add --slug docs --name "Documentation"

# Grant access to users
uv run gk apps grant --slug docs --email admin@example.com
```

## Auth Flow

1. User visits `https://docs.example.com/page`
2. Nginx sends `auth_request` to Gatekeeper with `X-GK-App: docs` header
3. Gatekeeper checks session cookie:
   - **No session** → returns 401 → Nginx redirects to `https://auth.example.com/signin?redirect=...`
   - **Session but no app access** → returns 403 → Nginx shows "Access Denied" or redirects to request access
   - **Session with access** → returns 200 with `X-Auth-User` header → Nginx proxies to app
4. User logs in at Gatekeeper, cookie set on `.example.com`
5. Redirect back to original URL, now auth succeeds

## Important: Cookie Domain

For SSO across subdomains, set in `.env`:

```bash
COOKIE_DOMAIN=.example.com  # Note the leading dot
```

Without this, cookies won't be shared between `auth.example.com` and `docs.example.com`.

## Detailed Guides

- [Nginx Configuration](nginx/README.md) - Full nginx setup, auth flow, caching
- [Systemd Service](systemd/README.md) - Service management, logs, troubleshooting
