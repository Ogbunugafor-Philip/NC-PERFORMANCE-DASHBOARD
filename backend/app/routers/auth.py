from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    FirstLoginRequest,
    LoginRequest,
    MessageResponse,
    PasswordChangeRequest,
    Token,
)
from app.services.auth_service import (
    authenticate_user,
    change_password,
    first_login,
    token_for_user,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/first-login", response_model=MessageResponse)
async def first_login_endpoint(
    payload: FirstLoginRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    await first_login(db, payload)
    return MessageResponse(message="Temporary password sent to email")


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, payload)
    return Token(
        access_token=token_for_user(user),
        requires_password_change=user.is_first_login,
    )


@router.post("/change-password", response_model=MessageResponse)
def change_password_endpoint(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    change_password(db, current_user, payload)
    return MessageResponse(message="Password changed successfully")
