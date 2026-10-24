"""Unit and integration tests for AI task generation service.

OWNER: Member 3 (AI Engineer)

Covers all 11 requirements from Section 12 of the project specification:
1. Empty project title is rejected.
2. Empty project description is rejected.
3. Invalid team size is rejected.
4. A valid mocked Gemini response is parsed correctly.
5. Invalid model output triggers fallback.
6. Missing API key triggers fallback.
7. Model request failure triggers fallback.
8. Fallback response has the required fields.
9. Every priority belongs to Low, Medium, or High.
10. Estimated days are positive integers.
11. The source field correctly identifies "gemini" or "fallback".
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from backend.services.ai_task_service import (
    VALID_PRIORITIES,
    generate_fallback_tasks,
    generate_tasks,
    validate_inputs,
)


# ============================================================================
# 1, 2, 3: Input Validation Tests
# ============================================================================

def test_empty_project_title_is_rejected():
    """Empty or whitespace-only project titles must raise ValueError."""
    with pytest.raises(ValueError, match="Project title is required"):
        generate_tasks(project_title="", project_description="A description", team_size=3)

    with pytest.raises(ValueError, match="Project title is required"):
        generate_tasks(project_title="   ", project_description="A description", team_size=3)


def test_empty_project_description_is_rejected():
    """Empty or whitespace-only project descriptions must raise ValueError."""
    with pytest.raises(ValueError, match="Project description is required"):
        generate_tasks(project_title="Valid Title", project_description="", team_size=3)

    with pytest.raises(ValueError, match="Project description is required"):
        generate_tasks(project_title="Valid Title", project_description="   ", team_size=3)


@pytest.mark.parametrize("invalid_size", [0, -1, -5, 21, 100])
def test_out_of_range_team_size_is_rejected(invalid_size):
    """Team size outside [1, 20] must raise ValueError."""
    with pytest.raises(ValueError, match="Team size must be a positive integer"):
        generate_tasks(
            project_title="Valid Title",
            project_description="Valid Description",
            team_size=invalid_size,
        )


@pytest.mark.parametrize("invalid_type_size", ["three", 3.5, None, True, False])
def test_non_integer_team_size_is_rejected(invalid_type_size):
    """Non-integer team sizes must raise ValueError."""
    with pytest.raises(ValueError, match="Team size must be an integer"):
        generate_tasks(
            project_title="Valid Title",
            project_description="Valid Description",
            team_size=invalid_type_size,  # type: ignore[arg-type]
        )


def test_title_and_description_length_limits():
    """Oversized inputs must raise ValueError."""
    long_title = "A" * 201
    with pytest.raises(ValueError, match="Project title must not exceed"):
        generate_tasks(long_title, "Valid description", 3)

    long_desc = "B" * 2001
    with pytest.raises(ValueError, match="Project description must not exceed"):
        generate_tasks("Valid Title", long_desc, 3)


# ============================================================================
# 4, 11: Valid Mocked Gemini Response
# ============================================================================

def test_valid_mocked_gemini_response_parsed_correctly(monkeypatch):
    """A valid Gemini response must produce source='gemini' and validated tasks."""
    mock_payload = {
        "tasks": [
            {
                "title": "Define project scope",
                "description": "Outline objectives and milestones",
                "priority": "High",
                "estimated_days": 2,
            },
            {
                "title": "Design database schema",
                "description": "Create PostgreSQL tables and relations",
                "priority": "High",
                "estimated_days": 3,
            },
            {
                "title": "Implement authentication",
                "description": "Set up secure session management",
                "priority": "Medium",
                "estimated_days": 2,
            },
            {
                "title": "Build task assignment API",
                "description": "CRUD routes for tasks and members",
                "priority": "High",
                "estimated_days": 3,
            },
            {
                "title": "Develop React dashboard",
                "description": "Create task board and project overview",
                "priority": "Medium",
                "estimated_days": 4,
            },
            {
                "title": "Run test suite",
                "description": "Execute pytest and frontend tests",
                "priority": "Low",
                "estimated_days": 1,
            },
        ]
    }

    mock_response = MagicMock()
    mock_response.text = json.dumps(mock_payload)

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    monkeypatch.setenv("GEMINI_API_KEY", "test-mock-key")
    with patch("google.genai.Client", return_value=mock_client):
        result = generate_tasks(
            project_title="TeamSync Portal",
            project_description="A task management system for students",
            team_size=4,
        )

    assert result["source"] == "gemini"
    assert len(result["tasks"]) == 6
    for task in result["tasks"]:
        assert task["priority"] in VALID_PRIORITIES
        assert isinstance(task["estimated_days"], int)
        assert task["estimated_days"] >= 1
        assert task["title"]
        assert task["description"]


def test_gemini_response_with_markdown_code_fences(monkeypatch):
    """Model returning markdown code blocks (```json ... ```) must be properly parsed."""
    mock_payload = {
        "tasks": [
            {"title": f"Task {i}", "description": f"Desc {i}", "priority": "Medium", "estimated_days": 2}
            for i in range(1, 6)
        ]
    }
    raw_text = f"```json\n{json.dumps(mock_payload)}\n```"

    mock_response = MagicMock()
    mock_response.text = raw_text

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    monkeypatch.setenv("GEMINI_API_KEY", "test-mock-key")
    with patch("google.genai.Client", return_value=mock_client):
        result = generate_tasks("Fenced Project", "Description text", 3)

    assert result["source"] == "gemini"
    assert len(result["tasks"]) == 5


# ============================================================================
# 5: Invalid Model Output Triggers Fallback
# ============================================================================

@pytest.mark.parametrize(
    "bad_text",
    [
        "This is not JSON at all.",
        "{}",
        '{"tasks": []}',  # fewer than 5 tasks
        '{"tasks": [{"title": "T1", "priority": "High", "estimated_days": 1}]}',  # 1 task
        json.dumps({
            "tasks": [
                {"title": f"T{i}", "description": "D", "priority": "InvalidPriority", "estimated_days": 2}
                for i in range(5)
            ]
        }),
        json.dumps({
            "tasks": [
                {"title": "", "description": "D", "priority": "High", "estimated_days": 2}
                for i in range(5)
            ]
        }),
    ],
)
def test_invalid_model_output_triggers_fallback(monkeypatch, bad_text):
    """Malformed or non-conforming model responses must cleanly trigger fallback."""
    mock_response = MagicMock()
    mock_response.text = bad_text

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    monkeypatch.setenv("GEMINI_API_KEY", "test-mock-key")
    with patch("google.genai.Client", return_value=mock_client):
        result = generate_tasks("Resilient Project", "Valid description", 3)

    assert result["source"] == "fallback"
    assert 5 <= len(result["tasks"]) <= 8
    for task in result["tasks"]:
        assert task["priority"] in VALID_PRIORITIES
        assert isinstance(task["estimated_days"], int)
        assert task["estimated_days"] >= 1


# ============================================================================
# 6: Missing API Key Triggers Fallback
# ============================================================================

def test_missing_api_key_triggers_fallback(monkeypatch):
    """When GEMINI_API_KEY is not set or empty, fallback must be returned cleanly."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    result = generate_tasks(
        project_title="No Key Project",
        project_description="Building without key",
        team_size=3,
    )
    assert result["source"] == "fallback"
    assert 5 <= len(result["tasks"]) <= 8

    monkeypatch.setenv("GEMINI_API_KEY", "   ")
    result_blank = generate_tasks(
        project_title="Blank Key Project",
        project_description="Building with blank key",
        team_size=2,
    )
    assert result_blank["source"] == "fallback"
    assert 5 <= len(result_blank["tasks"]) <= 8


# ============================================================================
# 7: Model Request Failure Triggers Fallback
# ============================================================================

def test_model_request_failure_triggers_fallback(monkeypatch):
    """Network errors, API exceptions, or timeouts from SDK must trigger fallback."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("Connection timeout or API down")

    monkeypatch.setenv("GEMINI_API_KEY", "test-mock-key")
    with patch("google.genai.Client", return_value=mock_client):
        result = generate_tasks(
            project_title="Network Error Test",
            project_description="Handling network drops gracefully",
            team_size=3,
        )

    assert result["source"] == "fallback"
    assert 5 <= len(result["tasks"]) <= 8


# ============================================================================
# 8, 9, 10, 11: Fallback Structure and Constraints
# ============================================================================

def test_fallback_response_fields_and_types():
    """Verify fallback has tasks list, source='fallback', and all field constraints."""
    res = generate_fallback_tasks(
        project_title="Smart Campus Navigator",
        project_description="Indoor mapping app for university students",
        team_size=4,
    )

    assert res["source"] == "fallback"
    tasks = res["tasks"]
    assert isinstance(tasks, list)
    assert 5 <= len(tasks) <= 8

    for task in tasks:
        assert "title" in task and isinstance(task["title"], str) and task["title"].strip()
        assert "description" in task and isinstance(task["description"], str)
        assert task["priority"] in VALID_PRIORITIES
        assert isinstance(task["estimated_days"], int)
        assert task["estimated_days"] >= 1


def test_fallback_adapts_to_project_title():
    """Fallback tasks should mention the project title where practical."""
    title = "Autonomous Drone Fleet"
    res = generate_fallback_tasks(title, "Monitoring agricultural fields", 4)
    tasks_text = " ".join([t["title"] + " " + t["description"] for t in res["tasks"]])
    assert title in tasks_text


# ============================================================================
# 12: FastAPI Endpoint Integration Verification
# ============================================================================

def test_endpoint_returns_gemini_when_available(monkeypatch):
    """End-to-end FastAPI endpoint integration returns 200 with source='gemini'."""
    from fastapi.testclient import TestClient
    from backend.main import app

    mock_payload = {
        "tasks": [
            {"title": f"Endpoint Task {i}", "description": f"Endpoint Desc {i}", "priority": "High", "estimated_days": i}
            for i in range(1, 6)
        ]
    }
    mock_response = MagicMock()
    mock_response.text = json.dumps(mock_payload)

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    monkeypatch.setenv("GEMINI_API_KEY", "endpoint-test-key")
    with patch("google.genai.Client", return_value=mock_client):
        with TestClient(app) as client:
            resp = client.post(
                "/api/ai/generate-tasks",
                json={
                    "project_title": "End-to-End Test Project",
                    "project_description": "Verifying API integration contract",
                    "team_size": 3,
                },
            )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "gemini"
    assert len(body["tasks"]) == 5
    for task in body["tasks"]:
        assert task["priority"] in ("Low", "Medium", "High")
        assert task["estimated_days"] >= 1


def test_endpoint_returns_fallback_when_unconfigured(monkeypatch):
    """End-to-end FastAPI endpoint returns 200 with source='fallback' when no key."""
    from fastapi.testclient import TestClient
    from backend.main import app

    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with TestClient(app) as client:
        resp = client.post(
            "/api/ai/generate-tasks",
            json={
                "project_title": "Fallback Endpoint Project",
                "project_description": "Testing fallback via API endpoint",
                "team_size": 3,
            },
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "fallback"
    assert 5 <= len(body["tasks"]) <= 8
