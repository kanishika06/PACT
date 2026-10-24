"""AI task-generation endpoint.

This is an integration layer only: the generation logic lives in
backend/services/ai_task_service.py, which Member 3 owns. The endpoint
validates the service's output and returns suggestions. It never saves tasks —
the frontend submits the ones the user picks via POST /api/projects/{id}/tasks.
"""

import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError

from backend.schemas import AITaskGenerateRequest, AITaskGenerateResponse

logger = logging.getLogger("teamsync.ai")

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/generate-tasks", response_model=AITaskGenerateResponse)
def generate_tasks_endpoint(payload: AITaskGenerateRequest) -> AITaskGenerateResponse:
    try:
        from backend.services.ai_task_service import generate_tasks
    except ImportError:
        logger.exception("AI task service is not importable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI task generation service is unavailable",
        ) from None

    try:
        raw = generate_tasks(
            project_title=payload.project_title,
            project_description=payload.project_description,
            team_size=payload.team_size,
        )
    except Exception:
        # Includes Gemini outages and bad input reaching the service.
        logger.exception("AI task generation failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI task generation failed, please try again",
        ) from None

    # Validate the service's shape before handing anything to the frontend.
    try:
        result = AITaskGenerateResponse.model_validate(raw)
    except ValidationError:
        logger.exception("AI task service returned a malformed payload")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI task generation returned an unexpected response",
        ) from None

    if not result.tasks:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI task generation returned no tasks",
        )
    return result
