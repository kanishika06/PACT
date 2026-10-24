"""Dashboard statistics.

Authentication is out of scope for the MVP, so these figures are global demo
statistics across every project in the database, not per-user figures.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Project, Task
from backend.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db)) -> DashboardStats:
    total_projects = db.scalar(select(func.count()).select_from(Project)) or 0
    total_tasks = db.scalar(select(func.count()).select_from(Task)) or 0
    completed_tasks = (
        db.scalar(select(func.count()).select_from(Task).where(Task.status == "Completed"))
        or 0
    )
    pending_tasks = total_tasks - completed_tasks
    completion_percentage = (
        round(completed_tasks / total_tasks * 100, 2) if total_tasks else 0.0
    )

    return DashboardStats(
        total_projects=total_projects,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        completion_percentage=completion_percentage,
    )
