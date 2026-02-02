# Gatekeeper

A lightweight, self-hosted authentication gateway for internal tools. Supports email OTP and WebAuthn passkeys.

## Features

- Email-based OTP authentication
- WebAuthn/Passkey support for passwordless login
- Admin panel for user management
- Auto-approval for configured email domains
- SES and SMTP email support
- SQLite (default) or PostgreSQL database
- Email bounce/complaint handling for SES compliance

## Requirements

- Python 3.12+
- Node.js 22+ (for frontend)
- uv 0.9+ (Python package manager)

## Quick Start

### 1. Clone and setup environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your settings
# Important: Change SECRET_KEY for production
```

### 2. Install backend dependencies

```bash
uv sync
```

### 3. Set up the database

```bash
uv run all-migrations
```

This creates the SQLite database and applies all migrations.

### 4. Seed the admin user

```bash
uv run seed-admin admin@yourdomain.com
```

### 5. Run the backend

```bash
uv run gatekeeper
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/api/v1/docs`

### 6. Install and run frontend

```bash
cd frontend
cp .env.example .env  # Edit PUBLIC_APP_NAME if needed
npm install
npm run dev
```

The frontend will be available at `http://localhost:4321`

## Configuration

### Backend Environment Variables

| Variable           | Description                               | Default                             |
| ------------------ | ----------------------------------------- | ----------------------------------- |
| `APP_NAME`         | Application name (used in emails)         | Gatekeeper                          |
| `SECRET_KEY`       | Secret key for signing (min 32 chars)     | -                                   |
| `DATABASE_URL`     | Database connection string                | sqlite+aiosqlite:///./gatekeeper.db |
| `ACCEPTED_DOMAINS` | Comma-separated domains for auto-approval | -                                   |
| `EMAIL_PROVIDER`   | `ses` or `smtp`                           | ses                                 |
| `EMAIL_FROM_NAME`  | Sender display name in emails             | Gatekeeper                          |
| `WEBAUTHN_RP_ID`   | WebAuthn relying party ID                 | localhost                           |
| `WEBAUTHN_ORIGIN`  | Frontend origin for WebAuthn              | http://localhost:4321               |

See `.env.example` for all options.

### Frontend Environment Variables

| Variable          | Description                  | Default    |
| ----------------- | ---------------------------- | ---------- |
| `PUBLIC_APP_NAME` | Application name shown in UI | Gatekeeper |

See `frontend/.env.example`.

## Production Deployment

### Architecture

```
┌─────────────────────┐     ┌─────────────────────────────────────┐
│   Routing Server    │     │          Docs Server                │
│   (Public IP)       │     │       (Private IP)                  │
│                     │     │                                     │
│   nginx (SSL)       │────▶│   nginx                             │
│                     │     │   ├─ :8080 → API (:8000)            │
│   certbot           │     │   ├─ :4321 → Frontend (static)      │
│                     │     │   └─ :3000 → Docs (auth protected)  │
└─────────────────────┘     │                                     │
                            │   gatekeeper (systemd)              │
                            │   docs (static files)               │
                            └─────────────────────────────────────┘
```

### 1. Set up Docs Server

```bash
# Install dependencies
sudo apt update
sudo apt install -y nginx

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Node.js 22
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Clone and setup
cd ~/deploy
git clone <repo-url> gatekeeper
cd gatekeeper

# Setup environment
cp .env.example .env
# Edit .env with production values:
#   - APP_URL=https://yourdomain.com
#   - FRONTEND_URL=https://yourdomain.com
#   - WEBAUTHN_RP_ID=yourdomain.com
#   - WEBAUTHN_ORIGIN=https://yourdomain.com
#   - SERVER_RELOAD=false
#   - Configure email settings

# Run migrations and seed admin
uv run all-migrations
uv run seed-admin admin@yourdomain.com

# Build frontend
cd frontend
cp .env.example .env
echo 'PUBLIC_APP_NAME="Your App Name"' > .env
npm install
npm run build

# Setup systemd service
sudo cp ~/deploy/gatekeeper/deployment/systemd/gatekeeper.service /etc/systemd/system/
# Edit the service file with your paths
sudo systemctl daemon-reload
sudo systemctl enable gatekeeper
sudo systemctl start gatekeeper

# Setup nginx
sudo cp ~/deploy/gatekeeper/deployment/nginx/gatekeeper.conf /etc/nginx/sites-available/gatekeeper
# Edit the file: change variables at top
sudo ln -s /etc/nginx/sites-available/gatekeeper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Fix permissions for www-data
chmod 755 /home/ubuntu
chmod -R 755 /home/ubuntu/deploy
```

### 2. Set up Routing Server

```bash
# Install nginx and certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Setup nginx config (see deployment/nginx/README.md for details)
# Edit the file: replace variables at top
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 3. Firewall/Security Groups

**Routing Server (public):**

- Allow inbound: 80, 443 (from anywhere)
- Allow outbound: all to docs server private IP

**Docs Server (private):**

- Allow inbound: 8080, 4321, 3000 (from routing server only)
- No public access

### Database Reset

To completely reset the database:

```bash
sudo systemctl stop gatekeeper
rm ~/deploy/gatekeeper/gatekeeper.db
cd ~/deploy/gatekeeper
uv run all-migrations
uv run seed-admin admin@yourdomain.com
sudo systemctl start gatekeeper
```

## Development

### Local email testing

For local development, use [Mailhog](https://github.com/mailhog/MailHog):

```bash
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Then configure SMTP in `.env`:

```
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
```

View emails at `http://localhost:8025`

### Database

SQLite is used by default. Migrations are simple SQL files in `src/gatekeeper/db/migrations/`.

#### Running migrations

```bash
# Apply all pending migrations
uv run all-migrations

# Run a specific migration (e.g., migration #3)
uv run migrations --n 3
```

#### Creating new migrations

Add a new SQL file in `src/gatekeeper/db/migrations/` with the naming convention:

- `001_init.sql`
- `002_add_feature.sql`
- etc.

Migrations run in alphabetical order and are tracked in the `_migrations` table.

#### PostgreSQL

For PostgreSQL, change the database URL:

```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/gatekeeper
```

The migration runner supports both SQLite and PostgreSQL. For PostgreSQL, install `psycopg2-binary`:
```bash
uv add psycopg2-binary
uv run all-migrations
```

## API Endpoints

### Authentication (`/api/v1/auth/`)

- `POST /register` - Start registration (sends OTP)
- `POST /register/verify` - Complete registration
- `POST /signin` - Start sign-in (sends OTP)
- `POST /signin/verify` - Complete sign-in
- `POST /signout` - Sign out
- `GET /me` - Get current user
- `DELETE /me` - Delete own account
- `GET /passkeys` - List registered passkeys
- `DELETE /passkeys/{id}` - Delete a passkey
- `POST /passkey/register/options` - Get passkey registration options
- `POST /passkey/register/verify` - Complete passkey registration
- `POST /passkey/signin/options` - Get passkey sign-in options
- `POST /passkey/signin/verify` - Complete passkey sign-in

### Admin (`/api/v1/admin/`)

All endpoints require admin authentication.

- `GET /users` - List all users
- `GET /users/pending` - List pending registrations
- `POST /users` - Create user (sends invitation email)
- `PATCH /users/{id}` - Update user
- `POST /users/{id}/approve` - Approve registration
- `POST /users/{id}/reject` - Reject registration
- `DELETE /users/{id}` - Delete user

## Pages

| Path        | Description                                 | Auth Required    |
| ----------- | ------------------------------------------- | ---------------- |
| `/signin`   | Sign in page                                | No               |
| `/register` | Registration page                           | No               |
| `/account`  | Account settings (passkeys, delete account) | Yes              |
| `/admin`    | Admin panel                                 | Yes (admin only) |
| `/`         | Protected docs                              | Yes              |

## License

AGPL-3.0-or-later

AGPL means you're free to use, modify, and deploy Gatekeeper internally with no obligations. The source-sharing requirement only applies if you offer a modified version as a public-facing service.
