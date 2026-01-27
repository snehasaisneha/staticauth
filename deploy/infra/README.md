# Deployment Infrastructure

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Routing Server (43.205.73.181)                      │
│                                                                  │
│   engg.artpark.ai:443                                           │
│   ├── /api/*        → 172.26.1.196:8000 (StaticAuth API)        │
│   ├── /signin       → 172.26.1.196:4321 (Auth Frontend)         │
│   ├── /register     → 172.26.1.196:4321 (Auth Frontend)         │
│   ├── /admin        → 172.26.1.196:4321 (Auth Frontend)         │
│   └── /*            → 172.26.1.196:3000 (Protected Docs)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Private Network)
┌─────────────────────────────────────────────────────────────────┐
│               Docs Server (172.26.1.196)                         │
│                                                                  │
│   :8000  nginx → :8001 staticauth (FastAPI via systemd)         │
│   :4321  nginx serves frontend/dist (static files)              │
│   :3000  nginx serves enggdocs (auth-protected static)          │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/home/ubuntu/deploy/
├── enggdocs/                 # Static documentation files
├── staticauth/               # StaticAuth repo
│   ├── .env                  # (copied from infra/.env-staticauth)
│   ├── staticauth.db         # SQLite database
│   └── frontend/dist/        # Built Astro frontend
└── infra/
    ├── .env-staticauth       # Production env vars
    ├── backups/              # Database backups
    ├── nginx-docs-server.conf
    ├── nginx-routing-server.conf
    ├── staticauth.service
    ├── setup.sh
    └── deploy.sh
```

## First-Time Setup

### 1. On Docs Server (172.26.1.196)

```bash
# SSH into docs server
ssh ubuntu@172.26.1.196

# Clone/copy repos to deploy folder
mkdir -p ~/deploy
cd ~/deploy
git clone <staticauth-repo> staticauth
# Copy enggdocs folder

# Copy infra files
cp -r staticauth/deploy/infra .

# Create production .env
cp infra/.env-staticauth.example infra/.env-staticauth
nano infra/.env-staticauth  # Fill in secrets

# Run setup
sudo bash infra/setup.sh

# Deploy
bash infra/deploy.sh
```

### 2. On Routing Server (43.205.73.181)

```bash
# Copy nginx config
sudo cp nginx-routing-server.conf /etc/nginx/sites-available/engg.artpark.ai
sudo ln -s /etc/nginx/sites-available/engg.artpark.ai /etc/nginx/sites-enabled/

# Get SSL certificate
sudo certbot --nginx -d engg.artpark.ai

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

## Deployment (Updates)

```bash
ssh ubuntu@172.26.1.196
cd ~/deploy/staticauth
git pull
bash ../infra/deploy.sh
```

## Debugging

```bash
# Check staticauth service
sudo systemctl status staticauth
sudo journalctl -u staticauth -f

# Check nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# Test endpoints locally
curl http://localhost:8001/api/v1/health
curl http://localhost:4321/
curl http://localhost:3000/
```

## Database

```bash
# Backup manually
cp ~/deploy/staticauth/staticauth.db ~/deploy/infra/backups/manual_$(date +%Y%m%d).db

# Restore from backup
cp ~/deploy/infra/backups/staticauth_YYYYMMDD_HHMMSS.db ~/deploy/staticauth/staticauth.db
sudo systemctl restart staticauth
```
