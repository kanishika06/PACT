"""Project membership endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.crud import get_project_or_404, get_user_or_404
from backend.database import get_db
from backend.models import ProjectMember, User
from backend.schemas import ProjectMemberCreate, ProjectMemberResponse

router = APIRouter(prefix="/api/projects", tags=["members"])


@router.get("/{project_id}/members", response_model=list[ProjectMemberResponse])
def list_members(
    project_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[ProjectMemberResponse]:
    get_project_or_404(db, project_id)
    stmt = (
        select(ProjectMember, User)
        .join(User, User.id == ProjectMember.user_id)
        .where(ProjectMember.project_id == project_id)
    )
    return [
        ProjectMemberResponse(
            id=member.id,
            project_id=member.project_id,
            user_id=member.user_id,
            name=user.name,
            email=user.email,
        )
        for member, user in db.execute(stmt).all()
    ]


@router.post(
    "/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    project_id: uuid.UUID,
    payload: ProjectMemberCreate,
    db: Session = Depends(get_db),
) -> ProjectMemberResponse:
    get_project_or_404(db, project_id)
    user = get_user_or_404(db, payload.user_id)

    existing = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == payload.user_id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project",
        )

    member = ProjectMember(project_id=project_id, user_id=payload.user_id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return ProjectMemberResponse(
        id=member.id,
        project_id=member.project_id,
        user_id=member.user_id,
        name=user.name,
        email=user.email,
    )
