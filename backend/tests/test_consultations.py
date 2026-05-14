"""Tests des endpoints de consultations."""

import io
import pytest


def _auth_headers(client, username: str, password: str) -> dict:
    client.post("/api/auth/register", json={
        "username": username,
        "password": password,
        "full_name": f"User {username}",
        "role": "relais",
    })
    resp = client.post("/api/auth/login", json={
        "username": username,
        "password": password,
    })
    return {"Authorization": f"Bearer {resp.json()['token']}"}


def _approved_medecin_headers(client, username: str) -> dict:
    from backend.database import User
    from backend.tests.conftest import TestSessionLocal

    client.post("/api/auth/register", json={
        "username": username,
        "password": "medecin_pwd123",
        "full_name": f"Dr {username}",
        "role": "medecin",
        "credential_number": "CNOM-TEST-999",
    })
    with TestSessionLocal() as s:
        u = s.query(User).filter(User.username == username).first()
        if u:
            u.verification_status = "approved"
            s.commit()
    resp = client.post("/api/auth/login", json={
        "username": username,
        "password": "medecin_pwd123",
    })
    return {"Authorization": f"Bearer {resp.json()['token']}"}


def test_list_consultations_empty(client):
    headers = _auth_headers(client, "list_user1", "pass123456")
    resp = client.get("/api/consultations", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_consultations_has_total_count_header(client):
    headers = _auth_headers(client, "list_user2", "pass123456")
    resp = client.get("/api/consultations", headers=headers)
    assert resp.status_code == 200
    assert "x-total-count" in resp.headers


def test_get_consultation_not_found(client):
    headers = _auth_headers(client, "get_user1", "pass123456")
    resp = client.get("/api/consultations/nonexistent-id", headers=headers)
    assert resp.status_code == 404


def test_review_consultation_pending_medecin_blocked(client):
    """Un médecin en attente de vérification ne peut pas valider."""
    client.post("/api/auth/register", json={
        "username": "pending_medecin1",
        "password": "medecin_pwd123",
        "full_name": "Dr Pending",
        "role": "medecin",
        "credential_number": "CNOM-TEST-111",
    })
    resp = client.post("/api/auth/login", json={
        "username": "pending_medecin1",
        "password": "medecin_pwd123",
    })
    token = resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/consultations/fake-id/review", json={
        "decision": "suivi",
        "agrees_with_ai": True,
        "notes": "Suivi recommandé.",
    }, headers=headers)
    assert resp.status_code in (403, 404)


def test_dashboard_stats_requires_auth(client):
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 401


def test_dashboard_stats_relais_forbidden(client):
    headers = _auth_headers(client, "relais_dash_user", "pass123456")
    resp = client.get("/api/dashboard/stats", headers=headers)
    assert resp.status_code == 403


def test_audit_log_admin_only(client):
    headers = _auth_headers(client, "audit_relais_user", "pass123456")
    resp = client.get("/api/dashboard/audit-log", headers=headers)
    assert resp.status_code == 403


def test_admin_verifications_requires_admin(client):
    headers = _auth_headers(client, "verif_relais_user", "pass123456")
    resp = client.get("/api/admin/verifications", headers=headers)
    assert resp.status_code == 403
