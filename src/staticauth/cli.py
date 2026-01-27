"""CLI entry points for StaticAuth."""

import uvicorn

from staticauth.config import get_settings


def serve() -> None:
    """Start the API server."""
    settings = get_settings()
    uvicorn.run(
        "staticauth.main:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.server_reload,
    )
