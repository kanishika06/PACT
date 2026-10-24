"""Project endpoints."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.crud import get_project_or_404, get_user_or_404
from backend.database import get_db
from backend.models import Project
from backend.schemas import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db)) -> list[Project]:
    stmt = select(Project).order_by(Project.created_at.desc())
    return list(db.scalars(stmt))


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> Project:
    get_user_or_404(db, payload.owner_id, field="owner_id")
    project = Project(
        title=payload.title.strip(),
        description=payload.description,
        owner_id=payload.owner_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: uuid.UUID, db: Session = Depends(get_db)) -> Project:
    return get_project_or_404(db, project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
) -> Project:
    project = get_project_or_404(db, project_id)
    # exclude_unset keeps omitted fields from overwriting stored values.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value.strip() if field == "title" else value)
    db.commit()
    db.refresh(project)
    return project
