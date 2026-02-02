# Database Migrations

Gatekeeper uses a simple file-based migration system that works with both SQLite and PostgreSQL.

## Quick Start

```bash
# Run all pending migrations
uv run all-migrations

# Check migration status
python -m gatekeeper.db.migrate status

# Run a specific migration
uv run migrations --n 1
```

## How It Works

1. Migrations are SQL files in this directory, named `NNN_description.sql`
2. The `_migrations` table tracks which migrations have been applied
3. Running `uv run all-migrations` applies any pending migrations in order

## Database Support

### SQLite (default)
```bash
DATABASE_URL=sqlite+aiosqlite:///gatekeeper.db
uv run all-migrations
```

### PostgreSQL
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
uv run all-migrations
```

Or run manually:
```bash
psql $DATABASE_URL -f src/gatekeeper/db/migrations/001_init.sql
```

PostgreSQL support is included via `psycopg2-binary`.

## Fresh Install vs Upgrade

**Fresh install:** Just run `uv run all-migrations`. The single `001_init.sql` creates the complete schema.

**Upgrading from older versions:** If you have an existing database with partial schema, you may need to manually apply missing parts. Check migration status with `python -m gatekeeper.db.migrate status`.

## Adding New Migrations

1. Create a new file: `002_description.sql`
2. Write your SQL (use syntax compatible with both SQLite and PostgreSQL where possible)
3. Run `uv run all-migrations`

Example:
```sql
-- 002_add_some_column.sql
ALTER TABLE users ADD COLUMN some_column TEXT;
```

## Schema Overview

| Table | Purpose |
|-------|---------|
| `users` | User accounts with email, status, admin flag |
| `sessions` | Active login sessions |
| `otps` | One-time passwords for email verification |
| `passkey_credentials` | WebAuthn passkeys |
| `email_suppressions` | Bounced/complained emails |
| `apps` | Registered apps for multi-app SSO |
| `user_app_access` | Which users can access which apps |
| `app_access_requests` | Pending access requests |
| `_migrations` | Migration tracking |
