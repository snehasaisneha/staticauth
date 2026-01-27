"""CLI entry points for StaticAuth."""

import asyncio
import sys
import uuid

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


def seed_admin() -> None:
    """Seed an admin user.

    Usage: uv run seed-admin admin@example.com
    """
    if len(sys.argv) < 2:
        print("Usage: uv run seed-admin <email>")
        print("Example: uv run seed-admin admin@example.com")
        sys.exit(1)

    email = sys.argv[1].lower().strip()

    # Basic email validation
    if "@" not in email or "." not in email.split("@")[-1]:
        print(f"Error: Invalid email format: {email}")
        sys.exit(1)

    asyncio.run(_seed_admin_async(email))


async def _seed_admin_async(email: str) -> None:
    """Async implementation of seed_admin."""
    from sqlalchemy import select

    from staticauth.database import async_session_maker
    from staticauth.models.user import User, UserStatus

    async with async_session_maker() as db:
        # Check if user already exists
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            if existing.is_admin and existing.is_seeded:
                print(f"Seeded admin already exists: {email}")
            elif existing.is_admin:
                print(f"User {email} is already an admin (not seeded)")
            else:
                # Upgrade to seeded admin
                existing.is_admin = True
                existing.is_seeded = True
                existing.status = UserStatus.APPROVED
                await db.commit()
                print(f"Upgraded existing user to seeded admin: {email}")
            return

        # Create new seeded admin
        user = User(
            id=uuid.uuid4(),
            email=email,
            status=UserStatus.APPROVED,
            is_admin=True,
            is_seeded=True,
        )
        db.add(user)
        await db.commit()
        print(f"Created seeded admin: {email}")
