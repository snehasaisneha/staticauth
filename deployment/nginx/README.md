# Nginx Configuration

Two files, that's all you need:

| File | Purpose |
|------|---------|
| `gatekeeper.conf` | Serves Gatekeeper itself (frontend + API) |
| `protected-app.conf` | Template for apps protected by Gatekeeper |

## Quick Start

### 1. Set up Gatekeeper

```bash
# Copy and edit the config (change the variables at the top)
sudo cp gatekeeper.conf /etc/nginx/sites-available/auth.example.com
sudo nano /etc/nginx/sites-available/auth.example.com

# Enable it
sudo ln -s /etc/nginx/sites-available/auth.example.com /etc/nginx/sites-enabled/

# Get SSL certificate
sudo certbot --nginx -d auth.example.com

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Protect an App

```bash
# Copy the template
sudo cp protected-app.conf /etc/nginx/sites-available/docs.example.com
sudo nano /etc/nginx/sites-available/docs.example.com

# Edit the configuration section at the top:
# - app_slug: must match what you registered in Gatekeeper admin
# - app_domain: the public domain for this app
# - gatekeeper_url: where Gatekeeper is running
# - app_backend: where your app is running

# Enable it
sudo ln -s /etc/nginx/sites-available/docs.example.com /etc/nginx/sites-enabled/
sudo certbot --nginx -d docs.example.com
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Register the App in Gatekeeper

Before the protected app works, register it:

```bash
uv run gk apps add --slug my-app --name "My App"
uv run gk apps grant --slug my-app --email user@example.com
```

Or use the admin panel: go to Apps tab → Add App.

## Configuration Reference

### gatekeeper.conf

| Variable | Description | Example |
|----------|-------------|---------|
| `gatekeeper_backend` | Gatekeeper server address | `127.0.0.1:8000` |
| `gatekeeper_domain` | Public domain | `auth.example.com` |

### protected-app.conf

| Variable | Description | Example |
|----------|-------------|---------|
| `app_slug` | App identifier in Gatekeeper | `docs`, `grafana` |
| `app_domain` | Public domain for this app | `docs.example.com` |
| `gatekeeper_auth` | Gatekeeper server address | `127.0.0.1:8000` |
| `gatekeeper_url` | Public Gatekeeper URL | `https://auth.example.com` |
| `app_backend` | Your app's backend | `127.0.0.1:3000` |

## Static Files (Docs, Assets)

For static file servers (Sphinx docs, MkDocs, etc.), replace the `app_backend` upstream with a root directive:

```nginx
# Instead of:
upstream app_backend {
    server 127.0.0.1:3000;
}

# Remove that and in location / use:
location / {
    auth_request /_gatekeeper/validate;
    # ... auth_request_set lines stay the same ...

    # Serve static files instead of proxying
    root /var/www/docs;
    index index.html;
    try_files $uri $uri/ $uri.html =404;
}
```

## Auth Caching (High Traffic)

For apps with many requests (static doc sites with lots of assets), enable caching:

1. Add to `/etc/nginx/nginx.conf` in the `http {}` block:
   ```nginx
   proxy_cache_path /tmp/gk_auth levels=1:2 keys_zone=gk_auth:1m max_size=10m inactive=5m;
   ```

2. In your app config, uncomment the cache lines in `/_gatekeeper/validate`:
   ```nginx
   proxy_cache gk_auth;
   proxy_cache_key "$cookie_session";
   proxy_cache_valid 200 5m;
   proxy_cache_valid 401 403 10s;
   ```

This caches auth results per session cookie for 5 minutes, dramatically reducing backend load.

## How It Works

```
User → nginx → auth_request to Gatekeeper → validates session + app access
                                          ↓
                              200 OK: proxy to app with X-Auth-User header
                              401: redirect to /signin
                              403: show "access denied"
```

## Cookie Domain for SSO

For SSO across subdomains (`auth.example.com`, `docs.example.com`, `grafana.example.com`), set in Gatekeeper's `.env`:

```
COOKIE_DOMAIN=.example.com
```

This makes the session cookie work across all subdomains.
