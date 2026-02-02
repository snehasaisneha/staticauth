# CLI Reference

:::{admonition} TODO
:class: warning

This page is a placeholder. Full CLI reference coming soon.
:::

## Quick reference

```bash
# User commands
gk users add --email EMAIL [--admin] [--seeded] [--name NAME]
gk users list [--status pending|approved|rejected|all]
gk users approve --email EMAIL | --all-pending
gk users reject --email EMAIL
gk users update --email EMAIL [--name NAME] [--admin | --no-admin]
gk users remove --email EMAIL [--force]

# App commands
gk apps add --slug SLUG --name NAME
gk apps list
gk apps show --slug SLUG
gk apps grant --slug SLUG (--email EMAIL | --all-approved) [--role ROLE]
gk apps revoke --slug SLUG --email EMAIL
gk apps remove --slug SLUG [--force]

# Operations
gk ops serve [--host HOST] [--port PORT] [--reload | --no-reload] [--workers N]
gk ops test-email --to EMAIL
gk ops healthcheck
gk ops reset-sessions [--email EMAIL]
```

## Server command

The `gk ops serve` command starts the Gatekeeper API server. It accepts the following options:

| Option | Environment Variable | Default | Description |
|--------|---------------------|---------|-------------|
| `--host`, `-h` | `SERVER_HOST` | `0.0.0.0` | Host to bind to |
| `--port`, `-p` | `SERVER_PORT` | `8000` | Port to bind to |
| `--reload` / `--no-reload` | `SERVER_RELOAD` | `true` | Enable auto-reload on file changes |
| `--workers`, `-w` | - | `1` | Number of worker processes |

CLI arguments take precedence over environment variables.

```bash
# Use defaults from .env
gk ops serve

# Override host and port
gk ops serve --host 127.0.0.1 --port 9000

# Production mode with multiple workers
gk ops serve --no-reload --workers 4
```

:::{note}
The `--workers` option is incompatible with `--reload`. When using multiple workers, reload is automatically disabled.
:::

Run `gk --help` for the complete list of options.
