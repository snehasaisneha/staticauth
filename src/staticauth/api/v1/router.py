from fastapi import APIRouter

from staticauth.api.v1.admin import router as admin_router
from staticauth.api.v1.auth import router as auth_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(admin_router)
