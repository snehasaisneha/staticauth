# Managing apps

This guide covers registering apps, granting access, and setting up roles.

## What's an app?

In Gatekeeper, an "app" is any internal service you want to protect. Each app has:

- A **slug** — URL-safe identifier (e.g., `grafana`, `wiki`, `admin-panel`)
- A **name** — Human-readable display name
- **Access grants** — Which users can access it

When nginx checks authentication, it sends the app slug. Gatekeeper verifies the user is signed in *and* has access to that specific app.

## Registering apps

Add a new app:

```bash
uv run gk apps add --slug grafana --name "Grafana Dashboards"
```

The slug must be URL-safe (letters, numbers, hyphens). It's used in nginx configuration.

## Listing apps

See all registered apps:

```bash
uv run gk apps list
```

View details for a specific app, including who has access:

```bash
uv run gk apps show --slug grafana
```

## Granting access

Grant a user access to an app:

```bash
uv run gk apps grant --slug grafana --email alice@example.com
```

Grant with a role hint:

```bash
uv run gk apps grant --slug grafana --email alice@example.com --role editor
```

Role hints are passed to your app in headers. Gatekeeper doesn't enforce roles—your app decides what they mean.

Grant access to all approved users:

```bash
uv run gk apps grant --slug wiki --all-approved
```

This is useful for apps that should be available to everyone.

## Revoking access

Remove a user's access:

```bash
uv run gk apps revoke --slug grafana --email alice@example.com
```

The user can still sign in to Gatekeeper, but nginx will return 403 when they try to access this app.

## Removing apps

Delete an app:

```bash
uv run gk apps remove --slug old-dashboard
```

If the app has access grants, use `--force`:

```bash
uv run gk apps remove --slug old-dashboard --force
```

## Access requests

Users can request access to apps they don't have permission for. When they hit a 403, they see an option to request access.

Admins can see pending requests in the admin panel and approve or deny them.

## Using roles

When you grant access with a role, Gatekeeper passes it to your app in the `X-Auth-Role` header.

nginx configuration:

```nginx
auth_request_set $auth_role $upstream_http_x_auth_role;
proxy_set_header X-Auth-Role $auth_role;
```

Your app can then use this to show different UI or enforce permissions:

```python
role = request.headers.get("X-Auth-Role", "viewer")
if role == "admin":
    # Show admin features
```

Common role patterns:

- `viewer` / `editor` / `admin`
- `read` / `write`
- `member` / `owner`

The role is just a string—use whatever makes sense for your app.

## Bulk operations

Grant all approved users access to an app:

```bash
uv run gk apps grant --slug wiki --all-approved
```

This is useful when setting up a new app that everyone should access.
