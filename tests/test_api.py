import os
import tempfile
from pathlib import Path

os.environ["WAREHOUSE_DATABASE_URL"] = f"sqlite:///{Path(tempfile.mkdtemp()) / 'test.db'}"
os.environ["WAREHOUSE_UPLOAD_DIR"] = str(Path(tempfile.mkdtemp()) / "uploads")
os.environ["WAREHOUSE_BACKUP_DIR"] = str(Path(tempfile.mkdtemp()) / "backups")

from fastapi.testclient import TestClient
import pytest

from apps.api.app.database import Base, engine
from apps.api.app.main import app


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def client() -> TestClient:
    return TestClient(app)


def login(test_client: TestClient) -> None:
    response = test_client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert response.status_code == 200, response.text


def test_setup_login_me_and_change_password():
    test_client = client()
    response = test_client.get("/api/setup/status")
    assert response.status_code == 200
    assert response.json()["initialized"] is False

    response = test_client.post("/api/setup/init", json={"confirm": True})
    assert response.status_code == 200
    assert response.json()["username"] == "admin"

    login(test_client)
    assert test_client.get("/api/auth/me").json() == {"username": "admin"}

    response = test_client.post("/api/auth/change-password", json={"current_password": "admin", "new_password": "secret1"})
    assert response.status_code == 200
    test_client.post("/api/auth/logout")
    response = test_client.post("/api/auth/login", json={"username": "admin", "password": "secret1"})
    assert response.status_code == 200


def test_configuration_and_warehouse_crud():
    test_client = client()
    test_client.post("/api/setup/init", json={"confirm": True})
    login(test_client)

    unit = test_client.post("/api/units", json={"name": "Unit A", "code": "UA"}).json()
    province = test_client.post("/api/provinces", json={"name": "Province A", "code": "PA"}).json()
    commune = test_client.post("/api/communes", json={"name": "Commune A", "code": "CA", "province_id": province["id"]}).json()
    catalog = test_client.post("/api/catalogs", json={"category": "warehouse_type", "name": "Type A", "code": "TA"}).json()

    payload = {
        "name": "Warehouse A",
        "code": "WA",
        "unit_id": unit["id"],
        "province_id": province["id"],
        "commune_id": commune["id"],
        "warehouse_type_id": catalog["id"],
        "area": 100,
        "capacity": 200,
    }
    response = test_client.post("/api/warehouses", json=payload)
    assert response.status_code == 201, response.text
    warehouse = response.json()
    assert warehouse["name"] == "Warehouse A"

    response = test_client.put(f"/api/warehouses/{warehouse['id']}", json={**payload, "name": "Warehouse B"})
    assert response.status_code == 200
    assert response.json()["name"] == "Warehouse B"

    response = test_client.get("/api/reports/summary")
    assert response.json()["warehouses"] == 1

    response = test_client.delete(f"/api/warehouses/{warehouse['id']}")
    assert response.status_code == 204
    assert test_client.get("/api/warehouses").json() == []


def test_excel_template_and_backup_endpoints():
    test_client = client()
    test_client.post("/api/setup/init", json={"confirm": True})
    login(test_client)

    response = test_client.get("/api/excel/warehouses/template")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/vnd.openxmlformats")

    response = test_client.post("/api/backups/manual")
    assert response.status_code == 200
    assert response.json()["path"].endswith(".db")

    response = test_client.get("/api/backups/schedule")
    assert response.status_code == 200
    assert "cron" in response.json()
