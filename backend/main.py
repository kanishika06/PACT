"""TeamSync AI — FastAPI application entrypoint.

Run from the repository root:
    uvicorn backend.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import get_settings
from backend.database import check_connection, init_db
from backend.routes import ai, dashboard, members, projects, resources, tasks, users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("teamsync")

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Verify connectivity and create missing tables, then serve requests.

    A database that is unreachable is logged, not fatal: /health still answers
    and /health/db reports the real state.
    """
    if settings.using_sqlite_fallback:
        logger.warning(
            "DATABASE_URL is not set; using the local SQLite fallback. "
            "Set DATABASE_URL to use Supabase PostgreSQL."
        )
    ok, _ = check_connection()
    if ok:
        try:
            init_db()
            logger.info("Database connected and tables verified.")
        except Exception:
            logger.exception("Failed to create database tables")
    else:
        logger.error("Database is not reachable at startup; tables were not created.")
    yield


app = FastAPI(
    title="TeamSync AI API",
    description=(
        "Student project and team collaboration portal.\n\n"
        "Known limitations: authentication is out of scope for this MVP, so "
        "`/api/dashboard` returns global demo statistics rather than "
        "per-user figures, and every endpoint is unauthenticated."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

for router in (
    users.router,
    projects.router,
    members.router,
    tasks.project_tasks_router,
    tasks.tasks_router,
    resources.router,
    dashboard.router,
    ai.router,
):
    app.include_router(router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a generic 500 so stack traces and credentials never leak."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.get("/health", tags=["health"])
def health() -> dict:
    """Confirm the process is running. Does not touch the database."""
    return {"status": "ok", "service": "TeamSync AI API"}


@app.get("/health/db", tags=["health"])
def health_db() -> JSONResponse:
    """Report real database connectivity, verified by a live query."""
    ok, error = check_connection()
    backend_name = "sqlite" if settings.using_sqlite_fallback else "postgresql"
    if ok:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": "ok", "database": backend_name},
        )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "error", "database": backend_name, "detail": error},
    )
