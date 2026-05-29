from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserPosition
from app.utils.excel_parser import normalize_dao_code


def ensure_admin_user(db: Session) -> None:
    if not all(
        [
            settings.ADMIN_DAO_CODE,
            settings.ADMIN_EMAIL,
            settings.ADMIN_DEFAULT_PASSWORD,
        ]
    ):
        return

    dao_code = normalize_dao_code(settings.ADMIN_DAO_CODE or "")
    user = db.scalar(select(User).where(User.dao_code == dao_code))
    if user:
        return

    admin = User(
        name="System Administrator",
        dao_code=dao_code,
        email=(settings.ADMIN_EMAIL or "").lower(),
        hashed_password=get_password_hash(settings.ADMIN_DEFAULT_PASSWORD or ""),
        position=UserPosition.ADMIN,
        is_first_login=True,
    )
    db.add(admin)
    db.commit()
