import secrets
import uuid
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from gatekeeper.config import Settings, get_settings
from gatekeeper.models.session import Session
from gatekeeper.models.user import User


def utcnow() -> datetime:
    """Return current UTC time as naive datetime (for SQLite compatibility)."""
    return datetime.utcnow()


class SessionService:
    def __init__(self, db: AsyncSession, settings: Settings | None = None):
        self.db = db
        self.settings = settings or get_settings()

    def _generate_token(self) -> str:
        return secrets.token_urlsafe(32)

    async def create(self, user: User) -> Session:
        token = self._generate_token()
        expires_at = utcnow() + timedelta(days=self.settings.session_expiry_days)

        session = Session(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_by_token(self, token: str) -> Session | None:
        stmt = select(Session).where(
            Session.token == token,
            Session.expires_at > utcnow(),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_by_token(self, token: str) -> User | None:
        session = await self.get_by_token(token)
        if not session:
            return None

        stmt = select(User).where(User.id == session.user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def delete(self, token: str) -> bool:
        stmt = delete(Session).where(Session.token == token)
        result = await self.db.execute(stmt)
        return result.rowcount > 0

    async def delete_all_for_user(self, user_id: uuid.UUID) -> int:
        stmt = delete(Session).where(Session.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.rowcount

    async def cleanup_expired(self) -> int:
        stmt = delete(Session).where(Session.expires_at <= utcnow())
        result = await self.db.execute(stmt)
        return result.rowcount
