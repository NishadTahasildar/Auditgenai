def test_super_admin_can_create_society(client, super_admin_headers):
    payload = {
        "name": "Oakridge Residency",
        "registration_number": "REG-OR-303",
        "address": "303 Oak Lane",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postal_code": "560001",
    }
    response = client.post("/api/v1/societies", json=payload, headers=super_admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Oakridge Residency"
    assert data["id"] is not None


def test_non_super_admin_cannot_create_society(client, society_admin_a_headers):
    payload = {
        "name": "Unauthorized Society",
        "address": "404 Error Blvd",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411002",
    }
    response = client.post("/api/v1/societies", json=payload, headers=society_admin_a_headers)
    assert response.status_code == 403
    assert "Super administrator privileges required" in response.json()["detail"]


def test_society_admin_can_create_building_in_own_society(
    client, society_a, society_admin_a_headers
):
    payload = {"name": "Wing C"}
    response = client.post(
        f"/api/v1/societies/{society_a.id}/buildings",
        json=payload,
        headers=society_admin_a_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Wing C"
    assert data["society_id"] == society_a.id


def test_resident_cannot_create_building(client, society_a, resident_a_headers):
    payload = {"name": "Wing Unauthorized"}
    response = client.post(
        f"/api/v1/societies/{society_a.id}/buildings",
        json=payload,
        headers=resident_a_headers,
    )
    assert response.status_code == 403
    assert "Insufficient permissions" in response.json()["detail"]


def test_cross_society_isolation_admin_cannot_access_other_society(
    client, society_b, society_admin_a_headers
):
    # Society Admin A attempts to access Society B
    response = client.get(
        f"/api/v1/societies/{society_b.id}",
        headers=society_admin_a_headers,
    )
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_cross_society_isolation_admin_cannot_create_building_in_other_society(
    client, society_b, society_admin_a_headers
):
    payload = {"name": "Malicious Building"}
    response = client.post(
        f"/api/v1/societies/{society_b.id}/buildings",
        json=payload,
        headers=society_admin_a_headers,
    )
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_super_admin_can_access_any_society(client, society_a, society_b, super_admin_headers):
    res_a = client.get(f"/api/v1/societies/{society_a.id}", headers=super_admin_headers)
    assert res_a.status_code == 200
    assert res_a.json()["id"] == society_a.id

    res_b = client.get(f"/api/v1/societies/{society_b.id}", headers=super_admin_headers)
    assert res_b.status_code == 200
    assert res_b.json()["id"] == society_b.id


def test_create_flat_and_duplicate_rejection(
    client, building_a, society_admin_a_headers
):
    payload = {"flat_number": "501", "floor_number": 5, "area_sqft": 1100.0}

    # 1. First creation succeeds
    res1 = client.post(
        f"/api/v1/buildings/{building_a.id}/flats",
        json=payload,
        headers=society_admin_a_headers,
    )
    assert res1.status_code == 201
    assert res1.json()["flat_number"] == "501"

    # 2. Duplicate flat in same building fails
    res2 = client.post(
        f"/api/v1/buildings/{building_a.id}/flats",
        json=payload,
        headers=society_admin_a_headers,
    )
    assert res2.status_code == 400
    assert "already exists in building" in res2.json()["detail"]


def test_create_and_list_residents_in_society(
    client, society_a, society_admin_a_headers
):
    payload = {
        "full_name": "Rohan Deshmukh",
        "phone_number": "9876543210",
        "email": "rohan@test.com",
    }
    res_create = client.post(
        f"/api/v1/societies/{society_a.id}/residents",
        json=payload,
        headers=society_admin_a_headers,
    )
    assert res_create.status_code == 201
    assert res_create.json()["full_name"] == "Rohan Deshmukh"

    res_list = client.get(
        f"/api/v1/societies/{society_a.id}/residents",
        headers=society_admin_a_headers,
    )
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1
    assert any(r["full_name"] == "Rohan Deshmukh" for r in res_list.json())
