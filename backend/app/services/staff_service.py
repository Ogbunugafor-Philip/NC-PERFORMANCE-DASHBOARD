from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.user import User, UserPosition
from app.schemas.staff import ClusterMapping, StaffCreate, StaffUpdate
from app.services.user_service import (
    ensure_unique_dao_code,
    ensure_unique_email,
    update_user_admin,
    validate_cluster_assignment,
)
from app.utils.excel_parser import normalize_dao_code


def create_staff(db: Session, payload: StaffCreate) -> User:
    dao_code = normalize_dao_code(payload.dao_code)
    ensure_unique_dao_code(db, dao_code)
    validate_cluster_assignment(db, payload.position, payload.cluster_head_id)
    user = User(
        name=payload.name.strip(),
        dao_code=dao_code,
        position=payload.position,
        cluster_head_id=payload.cluster_head_id if payload.position == UserPosition.FSO else None,
        cluster_name=payload.cluster_name.strip() if payload.cluster_name else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_staff(
    db: Session,
    position: UserPosition | None = None,
    cluster_head_id: UUID | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> list[User]:
    statement = select(User)
    if position is not None:
        statement = statement.where(User.position == position)
    if cluster_head_id is not None:
        statement = statement.where(User.cluster_head_id == cluster_head_id)
    if is_active is not None:
        statement = statement.where(User.is_active == is_active)
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(User.name.ilike(pattern), User.dao_code.ilike(pattern), User.email.ilike(pattern))
        )
    return list(db.scalars(statement.order_by(User.position, User.name)).all())


def update_staff(db: Session, user_id: UUID, payload: StaffUpdate) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    return update_user_admin(db, user, payload)


def delete_staff(db: Session, user_id: UUID) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    db.delete(user)
    db.commit()


def assign_cluster_head(db: Session, payload: ClusterMapping) -> User:
    fso = db.get(User, payload.fso_id)
    cluster_head = db.get(User, payload.cluster_head_id)
    if not fso or fso.position != UserPosition.FSO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid FSO")
    if not cluster_head or cluster_head.position != UserPosition.CLUSTER_HEAD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cluster head",
        )
    fso.cluster_head_id = cluster_head.id
    db.commit()
    db.refresh(fso)
    return fso


def create_staff_from_rows(db: Session, rows: list[dict[str, str]]) -> tuple[list[User], list[str]]:
    errors: list[str] = []
    created: list[User] = []
    seen_dao_codes: set[str] = set()

    for index, row in enumerate(rows, start=2):
        try:
            dao_code = normalize_dao_code(row["dao_code"])
            if dao_code in seen_dao_codes:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Duplicate DAO code in upload: {dao_code}",
                )
            seen_dao_codes.add(dao_code)

            position = UserPosition(row["position"].strip().upper())
            cluster_head_id = None
            assigned_cluster_head = row.get("assigned_cluster_head")
            if assigned_cluster_head:
                cluster_head = db.scalar(
                    select(User).where(
                        User.dao_code == normalize_dao_code(assigned_cluster_head),
                        User.position == UserPosition.CLUSTER_HEAD,
                    )
                )
                if not cluster_head:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid cluster head mapping: {assigned_cluster_head}",
                    )
                cluster_head_id = cluster_head.id

            user = create_staff(
                db,
                StaffCreate(
                    name=row["name"],
                    dao_code=dao_code,
                    position=position,
                    cluster_head_id=cluster_head_id,
                ),
            )
            created.append(user)
        except ValueError:
            errors.append(f"Row {index}: invalid position")
        except HTTPException as exc:
            errors.append(f"Row {index}: {exc.detail}")
        except Exception as exc:
            errors.append(f"Row {index}: {str(exc)}")

    return created, errors
