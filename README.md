# TeamSync AI

**From Ideas to Execution.**

A student project and team collaboration portal. Students create projects,
manage teams, assign tasks, track deadlines, store resource links, and use AI
to generate suggested project tasks.

This repository contains both halves:

- **`backend/`** — FastAPI + SQLAlchemy + PostgreSQL. Setup and the full API
  reference are below.
- **`frontend/`** — React + TypeScript + Vite client, built to
  [FRONTEND_PLAN.md](FRONTEND_PLAN.md). See [frontend/README.md](frontend/README.md).

Run the backend first, then the frontend on `http://localhost:5173`.

---

## Setup (Windows PowerShell)

From the repository root (`D:\projects\PACT`):

```bash
python -m venv .venv
```

```bash
.\.venv\Scripts\Activate.ps1
```

```bash
pip install -r backend/requirements.txt
```

Copy the environment template and fill in real values:

```bash
copy .env.example .env
```

`.env` keys:

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase PostgreSQL connection string. If unset, the app falls back to a local SQLite file (`teamsync.db`) so you can develop without credentials. |
| `GEMINI_API_KEY` | Used only by `backend/services/ai_task_service.py` (Member 3). If omitted, deterministic fallback mode is used. |
| `GEMINI_MODEL` | Optional Gemini model name (defaults to `gemini-2.5-flash`). |
| `FRONTEND_ORIGIN` | Comma-separated allowed CORS origins. Defaults to `http://localhost:5173,http://127.0.0.1:5173`. |

`DATABASE_URL` is normalized automatically: a Supabase-style
`postgresql://...` or `postgres://...` URL is rewritten to
`postgresql+psycopg://...` so it works with the installed psycopg 3 driver.

### Initialize demo data

Tables are created automatically on startup. To add the repeatable demo users
(idempotent — safe to run many times):

```bash
python -m backend.seed
```

The frontend obtains demo user UUIDs from `GET /api/users`; there is no
hardcoded user list on either side.

### Run the server

```bash
uvicorn backend.main:app --reload
```

Swagger UI: <http://127.0.0.1:8000/docs>

### Run the tests

```bash
python -m pytest backend/tests -v
```

Tests run against an isolated temporary SQLite database and do not touch your
development data.

---

## API reference

All data routes are prefixed with `/api`. Health checks are not.

### Health

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Confirms the process is running. Does **not** check the database. Returns `{"status": "ok", "service": "TeamSync AI API"}`. |
| GET | `/health/db` | Runs a real `SELECT 1`. Returns 200 with the backend name, or 503 if the database is unreachable. |

### Users

Authentication is out of scope for this MVP; these endpoints exist so the
frontend can pick a demo owner or assignee.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/users` | List users. |
| POST | `/api/users` | Create a user. 400 on duplicate email. |
| GET | `/api/users/{user_id}` | Get one user. |

### Projects

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/projects` | List projects, newest first. |
| POST | `/api/projects` | Create a project. 201 on success; 404 if `owner_id` does not exist. |
| GET | `/api/projects/{project_id}` | Project details. 404 if missing. |
| PATCH | `/api/projects/{project_id}` | Partial update of `title` and/or `description`. Omitted fields are left untouched. |

`POST /api/projects` request body:

```json
{
  "title": "AI Traffic Management",
  "description": "Build an AI system to improve traffic flow",
  "owner_id": "VALID-USER-UUID"
}
```

### Project members

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/projects/{project_id}/members` | List members with their name and email. |
| POST | `/api/projects/{project_id}/members` | Add a member. 404 if the project or user is missing; 400 if already a member. |

Request body: `{"user_id": "VALID-USER-UUID"}`

### Tasks

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/projects/{project_id}/tasks` | Tasks for a project. Optional `?status=` filter. |
| POST | `/api/projects/{project_id}/tasks` | Create a task. The project comes from the URL. |
| GET | `/api/tasks/{task_id}` | Get one task. |
| PATCH | `/api/tasks/{task_id}` | Partial update of title, description, assignee_id, priority, status, due_date. |

`POST` request body (all fields but `title` optional):

```json
{
  "title": "Collect traffic data",
  "description": "Identify and prepare suitable datasets",
  "assignee_id": null,
  "priority": "High",
  "status": "To Do",
  "due_date": "2026-10-30"
}
```

Allowed `status` values — exactly: `To Do`, `In Progress`, `Completed`.
Allowed `priority` values — exactly: `Low`, `Medium`, `High`.
Anything else returns 422. A non-null `assignee_id` must exist in `users`.
Passing `"assignee_id": null` in a PATCH unassigns the task.

### Resources

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/projects/{project_id}/resources` | List resource links. |
| POST | `/api/projects/{project_id}/resources` | Add a link. `url` must start with `http://` or `https://`. |

### Dashboard

| Method | Path |
| --- | --- |
| GET | `/api/dashboard` |

```json
{
  "total_projects": 3,
  "total_tasks": 12,
  "completed_tasks": 5,
  "pending_tasks": 7,
  "completion_percentage": 41.67
}
```

`pending_tasks` is every task that is not `Completed`, so it covers both
`To Do` and `In Progress`. `completion_percentage` is
`completed_tasks / total_tasks * 100`, rounded to 2 decimals, and `0` when
there are no tasks.

### AI task generation

| Method | Path |
| --- | --- |
| POST | `/api/ai/generate-tasks` |

Request:

```json
{
  "project_title": "AI Traffic Management",
  "project_description": "Develop an AI system to improve traffic flow",
  "team_size": 3
}
```

Response:

```json
{
  "tasks": [
    {
      "title": "Collect traffic data",
      "description": "Identify and prepare suitable datasets",
      "priority": "High",
      "estimated_days": 2
    }
  ],
  "source": "fallback"
}
```

`source` honestly reports where the tasks came from: `gemini` when the model
produced them, `fallback` for the deterministic template. Fallback results are
never labelled as AI-generated.

**This endpoint returns suggestions only — it does not save anything.** The
frontend lets the user pick suggestions and submits the chosen ones through
`POST /api/projects/{project_id}/tasks`.

If generation fails or the service is unavailable, the endpoint returns 503. A
malformed response from the AI service returns 502. It never invents a
successful result.

### Error codes

| Code | Meaning |
| --- | --- |
| 200 | Successful retrieval or update |
| 201 | Successful creation |
| 400 | Invalid operation (e.g. duplicate membership, duplicate email) |
| 404 | Project, task or user not found |
| 422 | Request validation failure (bad status, priority, date or UUID) |
| 500 | Unexpected server error (generic message only) |
| 502 | AI service returned a malformed response |
| 503 | Database or AI service unavailable |

Error bodies contain a `detail` message only. Stack traces, connection strings
and API keys are never returned to clients.

---

## Project layout

```
backend/
├── main.py            FastAPI app, CORS, health checks, error handler
├── config.py          Environment loading and DATABASE_URL normalization
├── database.py        Engine, session factory, get_db dependency
├── models.py          SQLAlchemy models
├── schemas.py         Pydantic request/response schemas
├── crud.py            Shared lookup helpers
├── seed.py            Repeatable demo-user seed
├── requirements.txt
├── routes/
│   ├── users.py
│   ├── projects.py
│   ├── members.py
│   ├── tasks.py
│   ├── resources.py
│   ├── dashboard.py
│   └── ai.py          Integration layer for the AI service
├── services/
│   └── ai_task_service.py   Owned by Member 3 (Gemini SDK & deterministic fallback)
└── tests/
    ├── test_api.py          Owned by Member 2 (Backend API routes)
    └── test_ai_task_service.py Owned by Member 3 (AI service & fallback tests)

database/
└── schema.sql         PostgreSQL schema reference, owned by Member 3
```

### Ownership

- **Member 2 (backend):** `main.py`, `config.py`, `database.py`, `models.py`,
  `schemas.py`, `crud.py`, all of `routes/`, `seed.py`, `tests/test_api.py`.
- **Member 3 (AI & DB):** `backend/services/ai_task_service.py`,
  `database/schema.sql`, and `backend/tests/test_ai_task_service.py`.

`backend/services/ai_task_service.py` implements the complete Gemini integration
via the official `google-genai` SDK along with a deterministic fallback for zero-dependency
reliability. It adheres strictly to the contract:

```python
generate_tasks(project_title: str, project_description: str, team_size: int = 3) -> dict
```

returning:

```json
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "Low" | "Medium" | "High",
      "estimated_days": 2
    }
  ],
  "source": "gemini" | "fallback"
}
```

The backend validates that shape before it reaches the frontend, ensuring data integrity.
Input validation strictly checks non-empty titles, descriptions, and integer team sizes (1-20).

`database/schema.sql` provides the canonical PostgreSQL/Supabase schema reference
synchronized with `backend/models.py`. Both maintain identical table names, column
names, types, nullability, defaults, UUID primary keys, and cascade rules.

---

## Known limitations

- **No authentication or authorization.** Every endpoint is open. This is a
  deliberate MVP scope decision and the main future improvement.
- **The dashboard is global, not per-user.** Because there are no accounts,
  `/api/dashboard` aggregates every project and task in the database. It is
  demo statistics, not a user's own figures.
- **No migration framework.** Tables are created with
  `Base.metadata.create_all()` on startup. Adequate for a prototype; column
  changes to an existing database need to be applied by hand.
- **Deletion endpoints are not implemented.** Only create, read and update.
- Faculty dashboard, real-time chat and push notifications are out of scope.

### Environment notes
 
- **SQLite fallback (Verified):** with no `DATABASE_URL`, the app uses a local
  `teamsync.db`. UUID columns are stored as `CHAR(36)` there and as native
  `uuid` on PostgreSQL; `skills` is `JSON` on SQLite and `JSONB` on PostgreSQL.
  Timestamps come back without a UTC offset on SQLite and with one on
  PostgreSQL. Full CRUD, demo seeding, and persistence were verified against SQLite.
- **Supabase connectivity (Unverified — credentials pending):** No credentials were
  provided in the environment, so live Supabase connectivity is unverified. The
  `psycopg[binary]` (v3) driver and URL normalization logic are verified. Once
  a real `DATABASE_URL` is set, test `/health/db` to verify live connection.
- **Gemini API status (Mock-tested & Fallback Verified):** Fallback mode and mock
  parsing tests pass 100%. Live Gemini API calls require setting `GEMINI_API_KEY`
  in `.env`.
- **Windows Application Control:** on this machine the policy blocked
  SQLAlchemy's compiled Cython `.pyd` modules inside the virtualenv. They were
  removed so SQLAlchemy uses its supported pure-Python implementations. If you
  reinstall or upgrade SQLAlchemy and see
  `ImportError: DLL load failed while importing _immutabledict_cy`, delete the
  blocked files again:

  ```bash
  Get-ChildItem .venv/Lib/site-packages/sqlalchemy -Recurse -Filter "*_cy.cp*.pyd" | Remove-Item
  ```
