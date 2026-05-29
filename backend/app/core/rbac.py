from fastapi import HTTPException, status

from app.models.user import User, UserPosition


ROLE_HIERARCHY = {
    UserPosition.ADMIN: 4,
    UserPosition.RSM: 3,
    UserPosition.CLUSTER_HEAD: 2,
    UserPosition.FSO: 1,
}


def assert_roles(user: User, allowed_roles: tuple[UserPosition, ...]) -> None:
    if user.position not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


def can_view_user(actor: User, target: User) -> bool:
    if actor.position in (UserPosition.ADMIN, UserPosition.RSM):
        return True
    if actor.position == UserPosition.CLUSTER_HEAD:
        return target.id == actor.id or target.cluster_head_id == actor.id
    return target.id == actor.id
