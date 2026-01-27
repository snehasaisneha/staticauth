from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from staticauth.models.user import UserStatus


class UserCreate(BaseModel):
    """Internal schema for creating a user."""

    email: EmailStr = Field(..., description="User's email address")
    status: UserStatus = Field(default=UserStatus.PENDING, description="Initial user status")
    is_admin: bool = Field(default=False, description="Whether user has admin privileges")


class UserRead(BaseModel):
    """User information."""

    id: UUID = Field(..., description="Unique user identifier")
    email: str = Field(..., description="User's email address")
    status: UserStatus = Field(..., description="User account status (pending, approved, rejected)")
    is_admin: bool = Field(..., description="Whether user has admin privileges")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "status": "approved",
                "is_admin": False,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            }
        },
    }


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    status: UserStatus | None = Field(default=None, description="New user status")
    is_admin: bool | None = Field(default=None, description="Set admin privileges")
