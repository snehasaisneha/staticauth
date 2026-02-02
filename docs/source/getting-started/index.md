# Getting Started

This guide walks you through installing Gatekeeper, configuring it for your environment, and protecting your first app.

## Prerequisites

Before you start, you'll need:

- **Python 3.12+** installed
- **uv** package manager ([install uv](https://docs.astral.sh/uv/getting-started/installation/))
- **nginx** for production deployments
- An **email provider** (AWS SES or SMTP) for sending login codes

For local development, you can skip nginx and use any SMTP server (or even a test email setup).

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/snehasaisneha/gatekeeper
cd gatekeeper
uv sync
```

This installs Gatekeeper and all its dependencies in an isolated virtual environment.

## Configuration

Gatekeeper is configured through environment variables. Copy the example file and edit it:

```bash
cp .env.example .env
```

Open `.env` and set these required values:

```bash
# A random string, at least 32 characters. Used to sign session tokens.
SECRET_KEY=your-secret-key-at-least-32-characters-long

# Where Gatekeeper is hosted
APP_URL=http://localhost:8000

# Where the frontend is hosted (same as APP_URL for simple setups)
FRONTEND_URL=http://localhost:8000
```

For email delivery, configure one of these:

::::{tab-set}

:::{tab-item} AWS SES
```bash
EMAIL_PROVIDER=ses
SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
EMAIL_FROM=noreply@yourdomain.com
```
:::

:::{tab-item} SMTP
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=you@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=you@gmail.com
```
:::

::::

See [Configuration](configuration.md) for all available options.

## Database setup

Initialize the database and run migrations:

```bash
uv run all-migrations
```

This creates a SQLite database file (`gatekeeper.db`) in the current directory.

## Create your admin account

Create the first admin user:

```bash
uv run gk users add --email you@example.com --admin --seeded
```

The `--seeded` flag means this user is pre-approved and can sign in immediately. The `--admin` flag gives them access to the admin panel.

## Start the server

Run the development server:

```bash
uv run gk ops serve
```

Open `http://localhost:8000` in your browser. You'll see the sign-in page.

## Sign in

1. Enter your email address
2. Check your inbox for the 6-digit code
3. Enter the code to complete sign-in

You're now signed in as an admin. Click your email in the top right to access the admin panel.

## Next steps

- [Configuration](configuration.md) — All environment variables explained
- [Protecting your first app](first-app.md) — Set up nginx to protect a service
- [Managing users](../guides/users.md) — Add and manage users

```{toctree}
:hidden:

configuration
first-app
```
