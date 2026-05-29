from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.user import User, UserPosition
from app.schemas.user import OwnProfileUpdate, UserUpdate
from app.utils.excel_parser import normalize_dao_code, validate_dao_code_format


def get_user_by_identifier(db: Session, identifier: str) -> User | None:
    normalized = normalize_dao_code(identifier)
    statement = select(User).where(
        or_(User.dao_code == normalized, User.email == identifier.strip().lower())
    )
    return db.scalar(statement)


def get_user_by_dao_code(db: Session, dao_code: str) -> User | None:
    return db.scalar(select(User).where(User.dao_code == normalize_dao_code(dao_code)))


def ensure_unique_dao_code(db: Session, dao_code: str, user_id: UUID | None = None) -> None:
    normalized = normalize_dao_code(dao_code)
    validate_dao_code_format(normalized)
    statement = select(User).where(User.dao_code == normalized)
    existing = db.scalar(statement)
    if existing and existing.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="DAO code already exists",
        )


def ensure_unique_email(db: Session, email: str | None, user_id: UUID | None = None) -> None:
    if not email:
        return
    existing = db.scalar(select(User).where(User.email == email.lower()))
    if existing and existing.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        )


def validate_cluster_assignment(db: Session, position: UserPosition, cluster_head_id: UUID | None) -> None:
    if position != UserPosition.FSO and cluster_head_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only FSOs can be assigned to a cluster head",
        )
    if position == UserPosition.FSO and cluster_head_id is not None:
        cluster_head = db.get(User, cluster_head_id)
        if not cluster_head or cluster_head.position != UserPosition.CLUSTER_HEAD:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned cluster head is invalid",
            )


def update_user_profile(db: Session, user: User, payload: OwnProfileUpdate) -> User:
    if payload.email is not None:
        ensure_unique_email(db, str(payload.email), user.id)
        user.email = str(payload.email).lower()
    if payload.name is not None:
        user.name = payload.name
    db.commit()
    db.refresh(user)
    return user


def update_user_admin(db: Session, user: User, payload: UserUpdate) -> User:
    data = payload.model_dump(exclude_unset=True)
    new_position = data.get("position", user.position)
    new_cluster_head_id = data.get("cluster_head_id", user.cluster_head_id)
    validate_cluster_assignment(db, new_position, new_cluster_head_id)
    if "email" in data:
        ensure_unique_email(db, str(data["email"]) if data["email"] else None, user.id)
        user.email = str(data["email"]).lower() if data["email"] else None
    for field in ("name", "position", "cluster_head_id", "is_active"):
        if field in data:
            setattr(user, field, data[field])
    db.commit()
    db.refresh(user)
    return user
