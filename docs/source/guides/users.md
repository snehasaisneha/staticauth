# Managing users

This guide covers adding users, handling registration approvals, and managing permissions.

## User lifecycle

Users in Gatekeeper go through these states:

1. **Pending** — Just registered, waiting for admin approval
2. **Approved** — Can sign in and access granted apps
3. **Rejected** — Registration denied, cannot sign in

Users from accepted email domains (see `ACCEPTED_DOMAINS`) skip the pending state and are approved automatically.

## Adding users

### Via CLI

Add a user directly:

```bash
uv run gk users add --email alice@example.com
```

This creates an approved user who can sign in immediately.

Add an admin user:

```bash
uv run gk users add --email admin@example.com --admin
```

Add a seeded user (pre-approved, for initial setup):

```bash
uv run gk users add --email founder@example.com --admin --seeded
```

### Via self-registration

Users can register themselves at `/register`. They enter their email, verify with a code, and:

- If their domain is in `ACCEPTED_DOMAINS`, they're approved automatically
- Otherwise, they go to pending status and need admin approval

## Listing users

See all users:

```bash
uv run gk users list
```

Filter by status:

```bash
uv run gk users list --status pending
uv run gk users list --status approved
uv run gk users list --status rejected
```

## Approving users

Approve a specific user:

```bash
uv run gk users approve --email alice@example.com
```

Approve all pending users at once:

```bash
uv run gk users approve --all-pending
```

You can also approve users from the admin panel at `/admin`.

## Rejecting users

Reject a registration:

```bash
uv run gk users reject --email spammer@example.com
```

Rejected users cannot sign in. They can register again with the same email if you later remove them.

## Updating users

Change a user's name:

```bash
uv run gk users update --email alice@example.com --name "Alice Smith"
```

Grant or revoke admin privileges:

```bash
# Make admin
uv run gk users update --email alice@example.com --admin

# Remove admin (use --no-admin)
uv run gk users update --email alice@example.com --no-admin
```

## Removing users

Remove a user:

```bash
uv run gk users remove --email alice@example.com
```

For users with app access, use `--force`:

```bash
uv run gk users remove --email alice@example.com --force
```

This also removes all their app access grants and sessions.

## Admins vs regular users

Admin users can:

- Access the admin panel at `/admin`
- Approve and reject registrations
- Manage apps and access grants
- View all users

Regular users can:

- Sign in to apps they have access to
- View their own profile
- Manage their passkeys
- Request access to apps

## Resetting sessions

If a user's session is compromised, invalidate all their sessions:

```bash
uv run gk ops reset-sessions --email alice@example.com
```

Or reset all sessions for everyone:

```bash
uv run gk ops reset-sessions
```
