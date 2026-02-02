# Nginx Configuration

## Architecture Overview

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Nginx (SSL termination, routing)                           │
│  - routing.conf: main server, certbot, subdomain routing    │
└─────────────────────────────────────────────────────────────┘
    │
    ├─► auth.example.com (gatekeeper.conf)
    │   └─ NO auth_request - publicly accessible
    │   └─ Serves: frontend + API
    │
    └─► docs.example.com (protected-app.conf)
        └─ auth_request to Gatekeeper
        └─ 401 → redirect to login
        └─ 403 → access denied
        └─ 200 → proxy to app
```

## Files

| File | Purpose |
|------|---------|
| `routing.conf` | Main routing server (SSL, certbot, include other configs) |
| `gatekeeper.conf` | Gatekeeper frontend + API (NO auth) |
| `protected-app.conf` | Template for protected apps (WITH auth) |

## Quick Start

### 1. Set Up Routing Server

```bash
# Copy main routing config
sudo cp routing.conf /etc/nginx/sites-available/example.com
sudo nano /etc/nginx/sites-available/example.com
# Edit: server_name, ssl_certificate paths, domain names

# Enable
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/

# Get wildcard SSL (or individual certs)
sudo certbot certonly --nginx -d example.com -d "*.example.com"
# Or individual: sudo certbot --nginx -d auth.example.com -d docs.example.com

sudo nginx -t && sudo systemctl reload nginx
```

### 2. Configure Gatekeeper

```bash
# Copy gatekeeper config
sudo cp gatekeeper.conf /etc/nginx/snippets/gatekeeper.conf
sudo nano /etc/nginx/snippets/gatekeeper.conf
# Edit: frontend_root path, backend port

# It's included by routing.conf, no need to enable separately
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Add a Protected App

```bash
# Copy template
sudo cp protected-app.conf /etc/nginx/snippets/protected-docs.conf
sudo nano /etc/nginx/snippets/protected-docs.conf
# Edit: app_slug, backend address

# Include it in routing.conf (see example in routing.conf)
sudo nginx -t && sudo systemctl reload nginx

# Register in Gatekeeper
uv run gk apps add --slug docs --name "Documentation"
uv run gk apps grant --slug docs --email admin@example.com
```

## Auth Flow Explained

### Happy Path (Authenticated User with Access)

```
1. GET https://docs.example.com/api/data
2. Nginx: auth_request → http://127.0.0.1:8000/api/v1/auth/validate
   Headers: X-GK-App: docs, Cookie: session=xxx
3. Gatekeeper: validates session, checks app access → 200 OK
   Response headers: X-Auth-User: user@example.com
4. Nginx: proxy_pass to app backend with X-Auth-User header
5. App receives request with authenticated user info
```

### Unauthenticated User

```
1. GET https://docs.example.com/page
2. Nginx: auth_request → Gatekeeper
3. Gatekeeper: no valid session → 401 Unauthorized
4. Nginx: error_page 401 → redirect to:
   https://auth.example.com/signin?redirect=https://docs.example.com/page
5. User logs in at Gatekeeper (cookie set on .example.com domain)
6. Gatekeeper redirects to original URL
7. Now auth_request returns 200 → user sees page
```

### Authenticated but No App Access

```
1. GET https://docs.example.com/page
2. Nginx: auth_request → Gatekeeper
3. Gatekeeper: valid session but no 'docs' access → 403 Forbidden
4. Nginx: error_page 403 → redirect to:
   https://auth.example.com/request-access?app=docs
   (or show inline "Access Denied" message)
```

## Cookie Domain for SSO

For SSO across subdomains, set in Gatekeeper's `.env`:

```bash
COOKIE_DOMAIN=.example.com
```

This makes the session cookie work across `auth.example.com`, `docs.example.com`, etc.

## Auth Caching (Optional)

For high-traffic apps, cache auth responses:

1. Add to `/etc/nginx/nginx.conf` in `http {}`:
   ```nginx
   proxy_cache_path /var/cache/nginx/gatekeeper
                    levels=1:2
                    keys_zone=gatekeeper_auth:1m
                    max_size=10m
                    inactive=5m;
   ```

2. Uncomment cache lines in `protected-app.conf`

## Troubleshooting

### "Too many redirects"
- Check `COOKIE_DOMAIN` matches your domain structure
- Ensure Gatekeeper itself (auth.example.com) has NO auth_request

### "401 on login page"
- Gatekeeper must be publicly accessible without auth_request
- Check gatekeeper.conf doesn't have auth_request directives

### "Cookie not sent"
- Check browser dev tools → cookies
- Verify `COOKIE_DOMAIN` is set correctly (needs leading dot: `.example.com`)
- Ensure HTTPS is used (cookies may be Secure)

### Auth validation slow
- Enable auth caching (see above)
- Check Gatekeeper logs for slow queries
