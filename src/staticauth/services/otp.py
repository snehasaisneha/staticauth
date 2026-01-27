import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from staticauth.config import Settings, get_settings
from staticauth.models.otp import OTP, OTPPurpose
from staticauth.services.email import EmailService


class OTPService:
    def __init__(self, db: AsyncSession, settings: Settings | None = None):
        self.db = db
        self.settings = settings or get_settings()
        self.email_service = EmailService(self.settings)

    def _generate_code(self) -> str:
        return "".join(secrets.choice("0123456789") for _ in range(6))

    async def create_and_send(self, email: str, purpose: OTPPurpose) -> bool:
        email = email.lower()

        await self._invalidate_previous(email, purpose)

        code = self._generate_code()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=self.settings.otp_expiry_minutes
        )

        otp = OTP(
            email=email,
            code=code,
            purpose=purpose,
            expires_at=expires_at,
        )
        self.db.add(otp)
        await self.db.flush()

        purpose_text = "sign in" if purpose == OTPPurpose.SIGNIN else "register"
        return await self.email_service.send_otp(email, code, purpose_text)

    async def verify(self, email: str, code: str, purpose: OTPPurpose) -> bool:
        email = email.lower()

        stmt = (
            select(OTP)
            .where(
                OTP.email == email,
                OTP.code == code,
                OTP.purpose == purpose,
                OTP.used == False,  # noqa: E712
                OTP.expires_at > datetime.now(timezone.utc),
            )
            .order_by(OTP.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        otp = result.scalar_one_or_none()

        if not otp:
            return False

        otp.used = True
        await self.db.flush()
        return True

    async def _invalidate_previous(self, email: str, purpose: OTPPurpose) -> None:
        stmt = select(OTP).where(
            OTP.email == email,
            OTP.purpose == purpose,
            OTP.used == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        otps = result.scalars().all()

        for otp in otps:
            otp.used = True
        await self.db.flush()
