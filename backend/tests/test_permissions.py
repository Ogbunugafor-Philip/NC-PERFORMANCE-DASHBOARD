"""Role-based access control tests — uses TestClient with mocked auth."""
import uuid
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.main import app
from app.models.user import User, UserPosition


# ── helpers ──────────────────────────────────────────────────────────────────

def _mock_user(position: UserPosition) -> User:
    u = MagicMock(spec=User)
    u.id = uuid.uuid4()
    u.name = f"Test {position.value}"
    u.dao_code = f"T{position.value[:4]}001"
    u.position = position
    u.is_active = True
    u.is_first_login = False
    u.email = f"test_{position.value.lower()}@sterling.com"
    u.cluster_head_id = None
    return u


@pytest.fixture(autouse=True)
def _clear_overrides():
    """Ensure dependency overrides are removed after every test."""
    yield
    app.dependency_overrides.clear()


client = TestClient(app, raise_server_exceptions=False)


def _as(position: UserPosition) -> None:
    """Override get_current_user to simulate the given role."""
    user = _mock_user(position)
    app.dependency_overrides[get_current_user] = lambda: user


# ── 401: unauthenticated ─────────────────────────────────────────────────────

def test_unauthenticated_returns_401():
    r = client.get("/api/v1/dashboard/rsm/summary")
    assert r.status_code == 401


def test_unauthenticated_admin_staff_returns_401():
    r = client.get("/api/v1/admin/staff")
    assert r.status_code == 401


# ── 403: FSO cannot access elevated endpoints ─────────────────────────────────

def test_fso_cannot_access_rsm_summary():
    _as(UserPosition.FSO)
    r = client.get("/api/v1/dashboard/rsm/summary")
    assert r.status_code == 403


def test_fso_cannot_access_admin_staff():
    _as(UserPosition.FSO)
    r = client.get("/api/v1/admin/staff")
    assert r.status_code == 403


def test_fso_cannot_access_admin_summary():
    _as(UserPosition.FSO)
    r = client.get("/api/v1/dashboard/admin/summary")
    assert r.status_code == 403


# ── 403: Cluster Head cannot access RSM/Admin endpoints ──────────────────────

def test_cluster_head_cannot_access_rsm_summary():
    _as(UserPosition.CLUSTER_HEAD)
    r = client.get("/api/v1/dashboard/rsm/summary")
    assert r.status_code == 403


def test_cluster_head_cannot_access_admin_staff():
    _as(UserPosition.CLUSTER_HEAD)
    r = client.get("/api/v1/admin/staff")
    assert r.status_code == 403


# ── 403: RSM cannot access admin-only endpoints ───────────────────────────────

def test_rsm_cannot_access_admin_summary():
    _as(UserPosition.RSM)
    r = client.get("/api/v1/dashboard/admin/summary")
    assert r.status_code == 403


def test_rsm_cannot_access_admin_staff():
    _as(UserPosition.RSM)
    r = client.get("/api/v1/admin/staff")
    assert r.status_code == 403


# ── Admin can access all endpoints (200 or 404 — never 401/403) ───────────────

def test_admin_can_access_admin_staff():
    _as(UserPosition.ADMIN)
    r = client.get("/api/v1/admin/staff")
    assert r.status_code not in (401, 403)


def test_admin_can_access_admin_summary():
    _as(UserPosition.ADMIN)
    r = client.get("/api/v1/dashboard/admin/summary")
    assert r.status_code not in (401, 403)


def test_admin_can_access_rsm_summary():
    _as(UserPosition.ADMIN)
    r = client.get("/api/v1/dashboard/rsm/summary")
    assert r.status_code not in (401, 403)
