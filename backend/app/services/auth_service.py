from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    generate_temp_password,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import FirstLoginRequest, LoginRequest, PasswordChangeRequest
from app.services.email_service import send_temp_password_email
from app.services.user_service import ensure_unique_email
from app.utils.excel_parser import normalize_dao_code, validate_dao_code_format


async def first_login(db: Session, payload: FirstLoginRequest) -> None:
    dao_code = normalize_dao_code(payload.dao_code)
    validate_dao_code_format(dao_code)
    user = db.scalar(select(User).where(User.dao_code == dao_code))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DAO code not found",
        )
    ensure_unique_email(db, str(payload.email), user.id)

    temp_password = generate_temp_password()
    user.email = str(payload.email).lower()
    user.hashed_password = get_password_hash(temp_password)
    user.is_first_login = True
    db.commit()

    await send_temp_password_email(user.email, user.name, temp_password)


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    identifier = payload.identifier.strip()
    if "@" not in identifier:
        validate_dao_code_format(normalize_dao_code(identifier))

    user = db.scalar(
        select(User).where(
            or_(
                User.dao_code == normalize_dao_code(identifier),
                User.email == identifier.lower(),
            )
        )
    )
    if not user or not user.is_active or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials",
        )
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials",
        )
    return user


def token_for_user(user: User) -> str:
    return create_access_token(
        {
            "sub": str(user.id),
            "role": user.position.value,
            "dao_code": user.dao_code,
        }
    )


def change_password(db: Session, user: User, payload: PasswordChangeRequest) -> None:
    if not user.hashed_password or not verify_password(
        payload.current_password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    user.hashed_password = get_password_hash(payload.new_password)
    user.is_first_login = False
    db.commit()
