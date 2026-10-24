"""Pydantic request/response schemas.

Field names here are the API contract the React frontend consumes.
"""

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

TaskStatus = Literal["To Do", "In Progress", "Completed"]
TaskPriority = Literal["Low", "Medium", "High"]

ALLOWED_RESOURCE_SCHEMES = ("http://", "https://")


class ORMModel(BaseModel):
    """Base for response models read straight off SQLAlchemy objects."""

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Users
# --------------------------------------------------------------------------- #
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    skills: list[str] | None = None


class UserResponse(ORMModel):
    id: uuid.UUID
    name: str
    email: str
    skills: list[str] | None = None


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #
class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    owner_id: uuid.UUID


class ProjectUpdate(BaseModel):
    """PATCH body. Unset fields are left untouched (see ``exclude_unset``)."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)


class ProjectResponse(ORMModel):
    id: uuid.UUID
    title: str
    description: str | None
    owner_id: uuid.UUID
    created_at: datetime


# --------------------------------------------------------------------------- #
# Project members
# --------------------------------------------------------------------------- #
class ProjectMemberCreate(BaseModel):
    user_id: uuid.UUID


class ProjectMemberResponse(ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    name: str | None = None
    email: str | None = None


# --------------------------------------------------------------------------- #
# Tasks
# --------------------------------------------------------------------------- #
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    assignee_id: uuid.UUID | None = None
    priority: TaskPriority = "Medium"
    status: TaskStatus = "To Do"
    due_date: date | None = None


class TaskUpdate(BaseModel):
    """PATCH body. Only fields actually supplied are applied."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    assignee_id: uuid.UUID | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    due_date: date | None = None


class TaskResponse(ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: str | None
    assignee_id: uuid.UUID | None
    priority: str
    status: str
    due_date: date | None
    created_at: datetime


# --------------------------------------------------------------------------- #
# Resources
# --------------------------------------------------------------------------- #
class ResourceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: str = Field(min_length=1, max_length=2048)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        value = value.strip()
        if not value.lower().startswith(ALLOWED_RESOURCE_SCHEMES):
            raise ValueError("url must start with http:// or https://")
        return value


class ResourceResponse(ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    url: str


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #
class DashboardStats(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_percentage: float


# --------------------------------------------------------------------------- #
# AI task generation
# --------------------------------------------------------------------------- #
class AITaskGenerateRequest(BaseModel):
    project_title: str = Field(min_length=1, max_length=200)
    project_description: str = Field(default="", max_length=5000)
    team_size: int = Field(default=3, ge=1, le=20)


class AISuggestedTask(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    priority: TaskPriority
    estimated_days: int = Field(ge=0, le=365)


class AITaskGenerateResponse(BaseModel):
    tasks: list[AISuggestedTask]
    source: str
