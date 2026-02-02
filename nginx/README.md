# Nginx Configuration Templates

Configuration templates for deploying Gatekeeper with a routing server architecture:

```
[Browser] --> [Routing Server] --> [Internal Server]
                (SSL/Certbot)        (Gatekeeper + Apps)
```

## Files

### Routing Server (SSL termination)
| File | Purpose |
|------|---------|
| `gatekeeper-proxy.conf` | Routes traffic to Gatekeeper |
| `app-proxy.conf` | Routes traffic to protected apps |

### Internal Server (Gatekeeper + apps)
| File | Purpose |
|------|---------|
| `gatekeeper.conf` | Gatekeeper API and frontend |
| `app.conf` | Protected app with auth_request |
| `docs-static.conf` | **Static docs with auth caching** |
| `app-internal.conf` | Protected app (alternative) |
| `gatekeeper-internal.conf` | Gatekeeper (alternative) |

### Systemd
| File | Purpose |
|------|---------|
| `gatekeeper.service` | Systemd service for Gatekeeper |

## Quick Start

### 1. Routing Server Setup

Copy proxy configs to the routing server:
```bash
# For Gatekeeper
sudo cp gatekeeper-proxy.conf /etc/nginx/sites-available/auth.example.com
# Edit and replace {{DOMAIN}}, {{INTERNAL_HOST}}, {{INTERNAL_PORT}}
sudo ln -s /etc/nginx/sites-available/auth.example.com /etc/nginx/sites-enabled/

# For each app
sudo cp app-proxy.conf /etc/nginx/sites-available/docs.example.com
# Edit and replace placeholders
sudo ln -s /etc/nginx/sites-available/docs.example.com /etc/nginx/sites-enabled/

# Get SSL certificates
sudo certbot --nginx -d auth.example.com -d docs.example.com

sudo nginx -t && sudo systemctl reload nginx
```

### 2. Internal Server Setup

Copy internal configs:
```bash
# Gatekeeper
sudo cp gatekeeper.conf /etc/nginx/sites-available/gatekeeper
# Edit and replace {{GATEKEEPER_PORT}}
sudo ln -s /etc/nginx/sites-available/gatekeeper /etc/nginx/sites-enabled/

# For static docs (recommended)
sudo cp docs-static.conf /etc/nginx/sites-available/docs
# Edit and replace placeholders
sudo ln -s /etc/nginx/sites-available/docs /etc/nginx/sites-enabled/

# Enable auth caching - add to /etc/nginx/nginx.conf http{} block:
# proxy_cache_path /tmp/gk_auth_cache levels=1:2 keys_zone=gk_auth:1m max_size=10m inactive=5m;

sudo nginx -t && sudo systemctl reload nginx
```

### 3. Systemd Service

```bash
sudo cp gatekeeper.service /etc/systemd/system/
# Edit and replace {{USER}}, {{GROUP}}, {{INSTALL_PATH}}, {{UV_PATH}}
sudo systemctl daemon-reload
sudo systemctl enable gatekeeper
sudo systemctl start gatekeeper
```

## Auth Caching

For high-traffic static doc sites, auth caching dramatically reduces backend load.

### How It Works

1. Add to `nginx.conf` http{} block:
   ```nginx
   proxy_cache_path /tmp/gk_auth_cache levels=1:2 keys_zone=gk_auth:1m max_size=10m inactive=5m;
   ```

2. The `docs-static.conf` template has caching enabled by default. For `app.conf`, uncomment the cache directives.

3. Cache behavior:
   - Cache key = session cookie (each user gets their own cached result)
   - Valid sessions cached for 5 minutes
   - Failed auth cached for 10 seconds
   - Access revocation takes effect within cache TTL

### Static Asset Options

**Option A: Skip auth** (better performance, less secure)
```nginx
location ~* \.(js|css|png|jpg|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Option B: Auth with caching** (default, more secure)
```nginx
location ~* \.(js|css|png|jpg|ico|svg|woff|woff2)$ {
    auth_request /_gatekeeper/validate;
    error_page 401 = @login_redirect;
    expires 1y;
}
```

## Cookie Domain for SSO

For SSO across subdomains (`auth.example.com`, `docs.example.com`), set in Gatekeeper's `.env`:

```
COOKIE_DOMAIN=.example.com
```

## How Auth Works

1. User requests `https://docs.example.com/page`
2. nginx sends subrequest: `GET /api/v1/auth/validate` with `X-GK-App: docs`
3. Gatekeeper checks session cookie and app access
4. If valid (200): Returns `X-Auth-User` and `X-Auth-Role` headers
5. If invalid (401): Redirects to Gatekeeper login
6. If forbidden (403): Shows access denied message
