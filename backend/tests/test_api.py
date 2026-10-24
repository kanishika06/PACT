"""API tests against an isolated SQLite database.

These verify application logic, not Supabase connectivity. Run from the
repository root:
    python -m pytest backend/tests -v
"""

import os
import tempfile
import uuid
from pathlib import Path

import pytest

# Point the app at a throwaway SQLite file before importing anything that
# builds the engine.
_TMP_DB = Path(tempfile.mkdtemp()) / "test_teamsync.db"
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///" + _TMP_DB.as_posix()

from fastapi.testclient import TestClient  # noqa: E402

from backend.database import init_db  # noqa: E402
from backend.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def user_id(client):
    response = client.post(
        "/api/users",
        json={"name": "Test Student", "email": f"test-{uuid.uuid4()}@example.com"},
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


@pytest.fixture(scope="module")
def project_id(client, user_id):
    response = client.post(
        "/api/projects",
        json={
            "title": "AI Traffic Management",
            "description": "Build an AI system to improve traffic flow",
            "owner_id": user_id,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "TeamSync AI API"}


def test_health_db(client):
    response = client.get("/health/db")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_list_projects(client, project_id):
    response = client.get("/api/projects")
    assert response.status_code == 200
    assert any(p["id"] == project_id for p in response.json())


def test_get_project_details(client, project_id, user_id):
    response = client.get(f"/api/projects/{project_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "AI Traffic Management"
    assert body["owner_id"] == user_id
    assert "created_at" in body


def test_missing_project_returns_404(client):
    response = client.get(f"/api/projects/{uuid.uuid4()}")
    assert response.status_code == 404


def test_patch_project_leaves_omitted_fields_alone(client, project_id):
    response = client.patch(f"/api/projects/{project_id}", json={"title": "AI Traffic v2"})
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "AI Traffic v2"
    assert body["description"] == "Build an AI system to improve traffic flow"


def test_add_member_and_reject_duplicate(client, project_id, user_id):
    first = client.post(f"/api/projects/{project_id}/members", json={"user_id": user_id})
    assert first.status_code == 201, first.text
    assert first.json()["user_id"] == user_id

    duplicate = client.post(
        f"/api/projects/{project_id}/members", json={"user_id": user_id}
    )
    assert duplicate.status_code == 400


def test_add_member_unknown_user_returns_404(client, project_id):
    response = client.post(
        f"/api/projects/{project_id}/members", json={"user_id": str(uuid.uuid4())}
    )
    assert response.status_code == 404


def test_create_and_list_tasks(client, project_id, user_id):
    created = client.post(
        f"/api/projects/{project_id}/tasks",
        json={
            "title": "Collect traffic data",
            "description": "Identify and prepare suitable datasets",
            "assignee_id": user_id,
            "priority": "High",
            "status": "To Do",
            "due_date": "2026-10-30",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["project_id"] == project_id
    assert body["priority"] == "High"
    assert body["due_date"] == "2026-10-30"

    listed = client.get(f"/api/projects/{project_id}/tasks")
    assert listed.status_code == 200
    assert any(t["id"] == body["id"] for t in listed.json())


def test_create_task_on_missing_project_returns_404(client):
    response = client.post(
        f"/api/projects/{uuid.uuid4()}/tasks", json={"title": "Orphan task"}
    )
    assert response.status_code == 404


def test_create_task_with_unknown_assignee_returns_404(client, project_id):
    response = client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Bad assignee", "assignee_id": str(uuid.uuid4())},
    )
    assert response.status_code == 404


def test_update_task_status(client, project_id):
    created = client.post(
        f"/api/projects/{project_id}/tasks", json={"title": "Task to complete"}
    )
    task_id = created.json()["id"]

    updated = client.patch(f"/api/tasks/{task_id}", json={"status": "Completed"})
    assert updated.status_code == 200
    body = updated.json()
    assert body["status"] == "Completed"
    # Untouched fields keep their stored values.
    assert body["title"] == "Task to complete"
    assert body["priority"] == "Medium"


def test_invalid_status_is_rejected(client, project_id):
    created = client.post(
        f"/api/projects/{project_id}/tasks", json={"title": "Status check"}
    )
    task_id = created.json()["id"]
    response = client.patch(f"/api/tasks/{task_id}", json={"status": "done"})
    assert response.status_code == 422


def test_invalid_priority_is_rejected(client, project_id):
    response = client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Priority check", "priority": "urgent"},
    )
    assert response.status_code == 422


def test_invalid_due_date_is_rejected(client, project_id):
    response = client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Date check", "due_date": "31-12-2026"},
    )
    assert response.status_code == 422


def test_missing_title_is_rejected(client, project_id):
    response = client.post(
        f"/api/projects/{project_id}/tasks", json={"description": "No title"}
    )
    assert response.status_code == 422


def test_dashboard_reflects_task_changes(client, project_id):
    before = client.get("/api/dashboard").json()
    assert before["total_projects"] >= 1
    assert before["pending_tasks"] == before["total_tasks"] - before["completed_tasks"]

    created = client.post(
        f"/api/projects/{project_id}/tasks", json={"title": "Dashboard task"}
    )
    task_id = created.json()["id"]
    client.patch(f"/api/tasks/{task_id}", json={"status": "Completed"})

    after = client.get("/api/dashboard").json()
    assert after["total_tasks"] == before["total_tasks"] + 1
    assert after["completed_tasks"] == before["completed_tasks"] + 1
    expected = round(after["completed_tasks"] / after["total_tasks"] * 100, 2)
    assert after["completion_percentage"] == expected


def test_resources(client, project_id):
    created = client.post(
        f"/api/projects/{project_id}/resources",
        json={"title": "Traffic dataset", "url": "https://example.org/dataset"},
    )
    assert created.status_code == 201, created.text

    bad = client.post(
        f"/api/projects/{project_id}/resources",
        json={"title": "Bad link", "url": "not-a-url"},
    )
    assert bad.status_code == 422

    listed = client.get(f"/api/projects/{project_id}/resources")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_ai_generate_tasks_structure(client):
    response = client.post(
        "/api/ai/generate-tasks",
        json={
            "project_title": "AI Traffic Management",
            "project_description": "Develop an AI system to improve traffic flow",
            "team_size": 3,
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["source"] in {"gemini", "fallback"}
    assert len(body["tasks"]) >= 1
    for task in body["tasks"]:
        assert task["priority"] in {"Low", "Medium", "High"}
        assert isinstance(task["estimated_days"], int)
        assert task["title"]


def test_ai_generate_tasks_does_not_persist(client, project_id):
    before = client.get(f"/api/projects/{project_id}/tasks").json()
    client.post(
        "/api/ai/generate-tasks",
        json={"project_title": "Anything", "project_description": "", "team_size": 2},
    )
    after = client.get(f"/api/projects/{project_id}/tasks").json()
    assert len(after) == len(before)


def test_ai_service_failure_returns_503(client, monkeypatch):
    import backend.services.ai_task_service as svc

    def boom(**_kwargs):
        raise RuntimeError("Gemini unavailable")

    monkeypatch.setattr(svc, "generate_tasks", boom)
    response = client.post(
        "/api/ai/generate-tasks",
        json={"project_title": "Fails", "project_description": "", "team_size": 1},
    )
    assert response.status_code == 503
