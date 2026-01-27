import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from staticauth.config import Settings, get_settings
from staticauth.models.session import Session
from staticauth.models.user import User


class SessionService:
    def __init__(self, db: AsyncSession, settings: Settings | None = None):
        self.db = db
        self.settings = settings or get_settings()

    def _generate_token(self) -> str:
        return secrets.token_urlsafe(32)

    async def create(self, user: User) -> Session:
        token = self._generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=self.settings.session_expiry_days
        )

        session = Session(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_by_token(self, token: str) -> Session | None:
        # First check if token exists at all (without expiry check)
        stmt_check = select(Session).where(Session.token == token)
        result_check = await self.db.execute(stmt_check)
        session_check = result_check.scalar_one_or_none()
        if session_check:
            print(f"[SESSION DEBUG] found session, expires_at={session_check.expires_at!r}, now={datetime.now(timezone.utc)!r}")
        else:
            print(f"[SESSION DEBUG] no session found for token")

        stmt = select(Session).where(
            Session.token == token,
            Session.expires_at > datetime.now(timezone.utc),
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
        stmt = delete(Session).where(Session.expires_at <= datetime.now(timezone.utc))
        result = await self.db.execute(stmt)
        return result.rowcount
