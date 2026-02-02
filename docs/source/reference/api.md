# API Reference

:::{admonition} TODO
:class: warning

This page is a placeholder. Full API reference coming soon.
:::

## Endpoints overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Start registration |
| POST | `/api/v1/auth/register/verify` | Complete registration |
| POST | `/api/v1/auth/signin` | Start sign-in |
| POST | `/api/v1/auth/signin/verify` | Complete sign-in |
| POST | `/api/v1/auth/signout` | Sign out |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/auth/validate` | Validate session (nginx) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List users |
| POST | `/api/v1/admin/users` | Create user |
| GET | `/api/v1/admin/apps` | List apps |
| POST | `/api/v1/admin/apps` | Create app |

For interactive API docs, run Gatekeeper and visit `/docs` (Swagger UI) or `/redoc` (ReDoc).
