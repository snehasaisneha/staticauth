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
gk ops serve
gk ops test-email --to EMAIL
gk ops healthcheck
gk ops reset-sessions [--email EMAIL]
```

Run `gk --help` for the complete list of options.
