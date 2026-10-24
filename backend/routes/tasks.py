"""Task endpoints.

Task creation and listing are nested under a project; updates address a task
directly, so this module registers two routers.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.crud import get_project_or_404, get_user_or_404
from backend.database import get_db
from backend.models import Task
from backend.schemas import TaskCreate, TaskResponse, TaskStatus, TaskUpdate

project_tasks_router = APIRouter(prefix="/api/projects", tags=["tasks"])
tasks_router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _get_task_or_404(db: Session, task_id: uuid.UUID) -> Task:
    from fastapi import HTTPException

    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found"
        )
    return task


@project_tasks_router.get("/{project_id}/tasks", response_model=list[TaskResponse])
def list_project_tasks(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    task_status: TaskStatus | None = Query(default=None, alias="status"),
) -> list[Task]:
    get_project_or_404(db, project_id)
    stmt = select(Task).where(Task.project_id == project_id)
    if task_status is not None:
        stmt = stmt.where(Task.status == task_status)
    return list(db.scalars(stmt.order_by(Task.created_at.asc())))


@project_tasks_router.post(
    "/{project_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    project_id: uuid.UUID,
    payload: TaskCreate,
    db: Session = Depends(get_db),
) -> Task:
    get_project_or_404(db, project_id)
    if payload.assignee_id is not None:
        get_user_or_404(db, payload.assignee_id, field="assignee_id")

    task = Task(
        project_id=project_id,
        title=payload.title.strip(),
        description=payload.description,
        assignee_id=payload.assignee_id,
        priority=payload.priority,
        status=payload.status,
        due_date=payload.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@tasks_router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: uuid.UUID, db: Session = Depends(get_db)) -> Task:
    return _get_task_or_404(db, task_id)


@tasks_router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
) -> Task:
    task = _get_task_or_404(db, task_id)
    changes = payload.model_dump(exclude_unset=True)

    # A supplied assignee must exist; an explicit null unassigns the task.
    if changes.get("assignee_id") is not None:
        get_user_or_404(db, changes["assignee_id"], field="assignee_id")

    for field, value in changes.items():
        setattr(task, field, value.strip() if field == "title" else value)

    db.commit()
    db.refresh(task)
    return task
