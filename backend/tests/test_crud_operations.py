import pytest


def test_update_and_delete_society(client, society_a, super_admin_headers, society_admin_a_headers):
    # 1. Society Admin can update own society
    update_payload = {
        "name": "Updated Society A",
        "city": "Navi Mumbai",
    }
    res_update = client.put(
        f"/api/v1/societies/{society_a.id}",
        json=update_payload,
        headers=society_admin_a_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Updated Society A"
    assert res_update.json()["city"] == "Navi Mumbai"

    # 2. Non-super admin cannot delete society
    res_del_denied = client.delete(
        f"/api/v1/societies/{society_a.id}",
        headers=society_admin_a_headers,
    )
    assert res_del_denied.status_code == 403

    # 3. Super Admin can delete society
    res_del = client.delete(
        f"/api/v1/societies/{society_a.id}",
        headers=super_admin_headers,
    )
    assert res_del.status_code == 200
    assert "deleted successfully" in res_del.json()["message"]

    # 4. Confirm society is gone
    res_check = client.get(
        f"/api/v1/societies/{society_a.id}",
        headers=super_admin_headers,
    )
    assert res_check.status_code == 404


def test_update_and_delete_building(client, building_a, society_admin_a_headers, resident_a_headers):
    # 1. Resident cannot update Building A
    res_unauth = client.put(
        f"/api/v1/buildings/{building_a.id}",
        json={"name": "Hacked Wing"},
        headers=resident_a_headers,
    )
    assert res_unauth.status_code == 403

    # 2. Resident cannot delete Building A
    res_del_unauth = client.delete(
        f"/api/v1/buildings/{building_a.id}",
        headers=resident_a_headers,
    )
    assert res_del_unauth.status_code == 403

    # 3. Society Admin A can update own building
    res_update = client.put(
        f"/api/v1/buildings/{building_a.id}",
        json={"name": "Renamed Wing A"},
        headers=society_admin_a_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Renamed Wing A"

    # 4. Society Admin A can delete Building A
    res_del = client.delete(
        f"/api/v1/buildings/{building_a.id}",
        headers=society_admin_a_headers,
    )
    assert res_del.status_code == 200
    assert "deleted successfully" in res_del.json()["message"]


def test_update_and_delete_flat(client, building_a, society_admin_a_headers, resident_a_headers):
    # Create flat first
    res_create = client.post(
        f"/api/v1/buildings/{building_a.id}/flats",
        json={"flat_number": "701", "floor_number": 7, "area_sqft": 1250.0},
        headers=society_admin_a_headers,
    )
    assert res_create.status_code == 201
    flat_id = res_create.json()["id"]

    # 1. Resident cannot update flat
    res_unauth = client.put(
        f"/api/v1/flats/{flat_id}",
        json={"flat_number": "701-Unauth"},
        headers=resident_a_headers,
    )
    assert res_unauth.status_code == 403

    # 2. Resident cannot delete flat
    res_del_unauth = client.delete(
        f"/api/v1/flats/{flat_id}",
        headers=resident_a_headers,
    )
    assert res_del_unauth.status_code == 403

    # 3. Society Admin A can update flat
    res_update = client.put(
        f"/api/v1/flats/{flat_id}",
        json={"flat_number": "701-A", "area_sqft": 1300.0},
        headers=society_admin_a_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["flat_number"] == "701-A"
    assert res_update.json()["area_sqft"] == 1300.0

    # 4. Society Admin A can delete flat
    res_del = client.delete(
        f"/api/v1/flats/{flat_id}",
        headers=society_admin_a_headers,
    )
    assert res_del.status_code == 200
    assert "deleted successfully" in res_del.json()["message"]


def test_update_and_delete_resident(client, society_a, society_admin_a_headers, resident_a_headers):
    # Create resident
    res_create = client.post(
        f"/api/v1/societies/{society_a.id}/residents",
        json={"full_name": "Kavita Sharma", "phone_number": "9998887776", "email": "kavita@test.com"},
        headers=society_admin_a_headers,
    )
    assert res_create.status_code == 201
    resident_id = res_create.json()["id"]

    # 1. Resident cannot update resident
    res_unauth = client.put(
        f"/api/v1/residents/{resident_id}",
        json={"full_name": "Kavita Malicious"},
        headers=resident_a_headers,
    )
    assert res_unauth.status_code == 403

    # 2. Resident cannot delete resident
    res_del_unauth = client.delete(
        f"/api/v1/residents/{resident_id}",
        headers=resident_a_headers,
    )
    assert res_del_unauth.status_code == 403

    # 3. Society Admin A can update resident
    res_update = client.put(
        f"/api/v1/residents/{resident_id}",
        json={"full_name": "Kavita S. Sharma", "phone_number": "9998887700"},
        headers=society_admin_a_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["full_name"] == "Kavita S. Sharma"
    assert res_update.json()["phone_number"] == "9998887700"

    # 4. Society Admin A can delete resident
    res_del = client.delete(
        f"/api/v1/residents/{resident_id}",
        headers=society_admin_a_headers,
    )
    assert res_del.status_code == 200
    assert "deleted successfully" in res_del.json()["message"]
