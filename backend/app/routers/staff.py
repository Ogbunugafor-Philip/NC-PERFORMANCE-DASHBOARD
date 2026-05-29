from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.user import User, UserPosition
from app.schemas.user import UserProfile


router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/cluster-heads", response_model=list[UserProfile])
def cluster_heads(
    _: User = Depends(require_roles(UserPosition.ADMIN, UserPosition.RSM)),
    db: Session = Depends(get_db),
) -> list[User]:
    return list(
        db.scalars(
            select(User)
            .where(User.position == UserPosition.CLUSTER_HEAD, User.is_active.is_(True))
            .order_by(User.name)
        ).all()
    )


@router.get("/fsos", response_model=list[UserProfile])
def visible_fsos(
    current_user: User = Depends(
        require_roles(
            UserPosition.ADMIN,
            UserPosition.RSM,
            UserPosition.CLUSTER_HEAD,
        )
    ),
    db: Session = Depends(get_db),
) -> list[User]:
    statement = select(User).where(User.position == UserPosition.FSO)
    if current_user.position == UserPosition.CLUSTER_HEAD:
        statement = statement.where(User.cluster_head_id == current_user.id)
    return list(db.scalars(statement.order_by(User.name)).all())


@router.get("/scope", response_model=UserProfile)
def my_scope(current_user: User = Depends(get_current_user)) -> User:
    return current_user
