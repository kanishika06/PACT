"""Seed a repeatable set of demo users.

Run from the repository root:
    python -m backend.seed

Idempotent: users are matched on email, so repeated runs do not create
duplicates. Only demo users are created; no fake projects or tasks, and no
real personal information.
"""

from sqlalchemy import select

from backend.database import SessionLocal, init_db
from backend.models import User

DEMO_USERS = [
    ("Demo Student One", "demo.one@example.com", ["Python", "FastAPI"]),
    ("Demo Student Two", "demo.two@example.com", ["React", "CSS"]),
    ("Demo Student Three", "demo.three@example.com", ["SQL", "Data Analysis"]),
    ("Demo Student Four", "demo.four@example.com", ["UI Design", "Testing"]),
]


def seed() -> list[User]:
    init_db()
    db = SessionLocal()
    try:
        created_or_found = []
        for name, email, skills in DEMO_USERS:
            user = db.scalar(select(User).where(User.email == email))
            if user is None:
                user = User(name=name, email=email, skills=skills)
                db.add(user)
                db.flush()
                print(f"created  {email}  {user.id}")
            else:
                print(f"existing {email}  {user.id}")
            created_or_found.append(user)
        db.commit()
        return created_or_found
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("\nDemo users ready. The frontend can fetch them from GET /api/users.")
