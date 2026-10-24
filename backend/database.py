"""SQLAlchemy engine, session factory and FastAPI session dependency."""

import logging
from collections.abc import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.config import get_settings

logger = logging.getLogger("teamsync.database")

settings = get_settings()

_engine_kwargs: dict = {"pool_pre_ping": True, "future": True}
if settings.database_url.startswith("sqlite"):
    # SQLite needs this to be usable from FastAPI's threadpool.
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs.update(pool_size=5, max_overflow=5, pool_recycle=300)

engine = create_engine(settings.database_url, **_engine_kwargs)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Iterator[Session]:
    """Yield a database session and always close it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_connection() -> tuple[bool, str | None]:
    """Run a trivial query to confirm the database is reachable.

    Returns ``(ok, error_message)``. The error message is deliberately generic
    so connection strings and credentials never reach a client.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, None
    except SQLAlchemyError:
        logger.exception("Database connectivity check failed")
        return False, "Database is not reachable"


def init_db() -> None:
    """Create any missing tables. Adequate for a prototype; no migrations."""
    from backend import models  # noqa: F401  (register models on Base.metadata)

    Base.metadata.create_all(bind=engine)
