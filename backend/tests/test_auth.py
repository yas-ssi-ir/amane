"""Tests d'authentification : register, login, me, change_password."""

import pytest


def test_register_relais(client):
    resp = client.post("/api/auth/register", json={
        "username": "relais_pytest",
        "password": "password123",
        "full_name": "Relais Test",
        "role": "relais",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "relais_pytest"
    assert data["role"] == "relais"
    assert data["verification_status"] == "not_required"


def test_register_medecin_requires_credential(client):
    resp = client.post("/api/auth/register", json={
        "username": "medecin_no_cred",
        "password": "password123",
        "full_name": "Dr Sans Cred",
        "role": "medecin",
    })
    assert resp.status_code == 422


def test_register_medecin_with_credential(client):
    resp = client.post("/api/auth/register", json={
        "username": "medecin_with_cred",
        "password": "password123",
        "full_name": "Dr Avec Cred",
        "role": "medecin",
        "credential_number": "CNOM-12345",
    })
    assert resp.status_code == 200
    assert resp.json()["verification_status"] == "pending"


def test_register_duplicate_username(client):
    payload = {
        "username": "dup_user",
        "password": "password123",
        "full_name": "Dup User",
        "role": "relais",
    }
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400


def test_login_success(client):
    client.post("/api/auth/register", json={
        "username": "login_test_user",
        "password": "mypassword123",
        "full_name": "Login Test",
        "role": "relais",
    })
    resp = client.post("/api/auth/login", json={
        "username": "login_test_user",
        "password": "mypassword123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["username"] == "login_test_user"


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "username": "wrongpwd_user",
        "password": "correct_password",
        "full_name": "Wrong Pwd Test",
        "role": "relais",
    })
    resp = client.post("/api/auth/login", json={
        "username": "wrongpwd_user",
        "password": "wrong_password",
    })
    assert resp.status_code == 401


def test_login_unknown_user(client):
    resp = client.post("/api/auth/login", json={
        "username": "nonexistent_user_xyz",
        "password": "any",
    })
    assert resp.status_code == 401


def test_me_authenticated(client):
    client.post("/api/auth/register", json={
        "username": "me_test_user",
        "password": "password123",
        "full_name": "Me Test",
        "role": "relais",
    })
    login = client.post("/api/auth/login", json={
        "username": "me_test_user",
        "password": "password123",
    })
    token = login.json()["token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["username"] == "me_test_user"


def test_me_unauthenticated(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_change_password(client):
    client.post("/api/auth/register", json={
        "username": "pwd_change_user",
        "password": "oldpassword123",
        "full_name": "Pwd Change Test",
        "role": "relais",
    })
    login = client.post("/api/auth/login", json={
        "username": "pwd_change_user",
        "password": "oldpassword123",
    })
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.patch("/api/auth/password", json={
        "current_password": "oldpassword123",
        "new_password": "newpassword456",
    }, headers=headers)
    assert resp.status_code == 200

    # Login avec le nouveau mot de passe doit fonctionner
    resp2 = client.post("/api/auth/login", json={
        "username": "pwd_change_user",
        "password": "newpassword456",
    })
    assert resp2.status_code == 200


def test_change_password_wrong_current(client):
    client.post("/api/auth/register", json={
        "username": "pwd_wrong_user",
        "password": "correctpwd123",
        "full_name": "Pwd Wrong Test",
        "role": "relais",
    })
    login = client.post("/api/auth/login", json={
        "username": "pwd_wrong_user",
        "password": "correctpwd123",
    })
    token = login.json()["token"]
    resp = client.patch("/api/auth/password", json={
        "current_password": "wrongpwd",
        "new_password": "newpassword456",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400


def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "checks" in data
