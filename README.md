# StaticAuth

A static authentication service for engineering docs and internal tools. Supports email OTP and WebAuthn passkeys.

## Features

- Email-based OTP authentication
- WebAuthn/Passkey support for passwordless login
- Admin panel for user management
- Auto-approval for configured email domains
- SES and SMTP email support
- SQLite (default) or PostgreSQL database

## Requirements

- Python 3.12+
- Node.js 22+ (for frontend)
- uv (Python package manager)

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

### 4. Run the backend

```bash
uv run staticauth
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/api/v1/docs`

### 5. Install and run frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:4321`

## Configuration

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name shown in UI | StaticAuth |
| `SECRET_KEY` | Secret key for signing (min 32 chars) | - |
| `DATABASE_URL` | Database connection string | sqlite+aiosqlite:///./staticauth.db |
| `ADMIN_EMAIL` | Email to auto-approve as admin | - |
| `ACCEPTED_DOMAINS` | Comma-separated domains for auto-approval | - |
| `EMAIL_PROVIDER` | `ses` or `smtp` | ses |
| `WEBAUTHN_RP_ID` | WebAuthn relying party ID | localhost |
| `WEBAUTHN_ORIGIN` | Frontend origin for WebAuthn | http://localhost:4321 |

See `.env.example` for all options.

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

SQLite is used by default. Migrations are simple SQL files in `src/staticauth/db/migrations/`.

#### Running migrations

```bash
# Apply all pending migrations
uv run all-migrations

# Run a specific migration (e.g., migration #3)
uv run migrations --n 3

# Check migration status
uv run python -m staticauth.db.migrate status
```

#### Creating new migrations

Add a new SQL file in `src/staticauth/db/migrations/` with the naming convention:
- `001_init.sql`
- `002_add_feature.sql`
- etc.

Migrations run in alphabetical order and are tracked in the `_migrations` table.

#### PostgreSQL

For PostgreSQL, change the database URL:

```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/staticauth
```

Note: The migration runner only supports SQLite. For PostgreSQL, run the SQL files manually with `psql`.

## API Endpoints

### Authentication (`/api/v1/auth/`)

- `POST /register` - Start registration (sends OTP)
- `POST /register/verify` - Complete registration
- `POST /signin` - Start sign-in (sends OTP)
- `POST /signin/verify` - Complete sign-in
- `POST /signout` - Sign out
- `GET /me` - Get current user
- `POST /passkey/register/options` - Get passkey registration options
- `POST /passkey/register/verify` - Complete passkey registration
- `POST /passkey/signin/options` - Get passkey sign-in options
- `POST /passkey/signin/verify` - Complete passkey sign-in

### Admin (`/api/v1/admin/`)

All endpoints require admin authentication.

- `GET /users` - List all users
- `GET /users/pending` - List pending registrations
- `POST /users` - Create user
- `POST /users/{id}/approve` - Approve registration
- `POST /users/{id}/reject` - Reject registration
- `DELETE /users/{id}` - Delete user

## License

MIT
