from app.models.user import User
from app.core.security import hash_password


def test_user_registration_success(client):
    payload = {
        "email": "newuser@test.com",
        "full_name": "New Registered User",
        "password": "SecurePassword123",
        "role": "RESIDENT",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["full_name"] == "New Registered User"
    assert data["is_active"] is True
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_user_registration_fails(client):
    payload = {
        "email": "dup@test.com",
        "full_name": "First User",
        "password": "Password123",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_successful_login(client, db):
    user = User(
        email="login_success@test.com",
        full_name="Valid User",
        password_hash=hash_password("CorrectPassword"),
        is_active=True,
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login_success@test.com", "password": "CorrectPassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "access_token" in response.cookies


def test_login_invalid_password(client, db):
    user = User(
        email="wrong_pass@test.com",
        full_name="User Wrong Pass",
        password_hash=hash_password("RightPassword"),
        is_active=True,
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong_pass@test.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_inactive_user_login_fails(client, db):
    user = User(
        email="inactive@test.com",
        full_name="Inactive User",
        password_hash=hash_password("SomePassword"),
        is_active=False,
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@test.com", "password": "SomePassword"},
    )
    assert response.status_code == 403
    assert "inactive" in response.json()["detail"].lower()


def test_protected_endpoint_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "credentials were not provided" in response.json()["detail"]


def test_protected_endpoint_with_valid_token(client, super_admin_headers):
    response = client.get("/api/v1/auth/me", headers=super_admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "superadmin@test.com"
    assert data["is_super_admin"] is True
    assert "password_hash" not in data


def test_users_me_endpoint(client, resident_a_headers):
    response = client.get("/api/v1/users/me", headers=resident_a_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "resident_a@test.com"
    assert data["is_super_admin"] is False


def test_logout_endpoint(client):
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
