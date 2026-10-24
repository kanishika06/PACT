"""Environment configuration for the TeamSync AI backend.

Values come from the process environment, loaded from a .env file at the
repository root if one exists. Never log or return these values.
"""

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Repository root is the parent of the backend/ package.
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

# Local development fallback so the API is usable without Supabase credentials.
SQLITE_FALLBACK_URL = f"sqlite+pysqlite:///{(BASE_DIR / 'teamsync.db').as_posix()}"

DEFAULT_FRONTEND_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


class Settings:
    """Plain settings object; no secrets are exposed in its repr."""

    def __init__(self) -> None:
        self.database_url: str = _normalize_database_url(
            os.getenv("DATABASE_URL", "").strip()
        )
        self.using_sqlite_fallback: bool = self.database_url == SQLITE_FALLBACK_URL
        self.frontend_origins: list[str] = [
            origin.strip()
            for origin in os.getenv("FRONTEND_ORIGIN", DEFAULT_FRONTEND_ORIGINS).split(",")
            if origin.strip()
        ]
        self.gemini_api_key_present: bool = bool(os.getenv("GEMINI_API_KEY", "").strip())

    def __repr__(self) -> str:  # pragma: no cover - avoid leaking the URL
        return f"<Settings sqlite_fallback={self.using_sqlite_fallback}>"


def _normalize_database_url(raw: str) -> str:
    """Make a Supabase/Postgres URL usable with the psycopg (v3) driver.

    Supabase hands out URLs starting with ``postgresql://`` or ``postgres://``;
    SQLAlchemy would then pick psycopg2, which is not installed. Rewrite the
    scheme to ``postgresql+psycopg://`` and leave everything else untouched.
    """
    if not raw:
        return SQLITE_FALLBACK_URL
    if raw.startswith("postgresql+") or raw.startswith("sqlite"):
        return raw
    if raw.startswith("postgresql://"):
        return "postgresql+psycopg://" + raw[len("postgresql://"):]
    if raw.startswith("postgres://"):
        return "postgresql+psycopg://" + raw[len("postgres://"):]
    return raw


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
