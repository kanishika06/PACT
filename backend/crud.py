"""Small shared lookup helpers used by the route modules."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models import Project, User


def get_project_or_404(db: Session, project_id: uuid.UUID) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    return project


def get_user_or_404(db: Session, user_id: uuid.UUID, field: str = "user_id") -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} referenced by '{field}' not found",
        )
    return user
