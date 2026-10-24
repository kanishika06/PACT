"""Project resource-link endpoints."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.crud import get_project_or_404
from backend.database import get_db
from backend.models import Resource
from backend.schemas import ResourceCreate, ResourceResponse

router = APIRouter(prefix="/api/projects", tags=["resources"])


@router.get("/{project_id}/resources", response_model=list[ResourceResponse])
def list_resources(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[Resource]:
    get_project_or_404(db, project_id)
    stmt = select(Resource).where(Resource.project_id == project_id)
    return list(db.scalars(stmt))


@router.post(
    "/{project_id}/resources",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_resource(
    project_id: uuid.UUID,
    payload: ResourceCreate,
    db: Session = Depends(get_db),
) -> Resource:
    get_project_or_404(db, project_id)
    resource = Resource(
        project_id=project_id, title=payload.title.strip(), url=payload.url
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource
