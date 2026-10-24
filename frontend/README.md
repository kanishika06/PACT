# TeamSync AI — Frontend

React + TypeScript + Vite client for the FastAPI backend in `../backend`.
Built to [FRONTEND_PLAN.md](../FRONTEND_PLAN.md).

## Run it

The backend must be running first (from the repository root):

```bash
uvicorn backend.main:app --reload
```

Then, in `frontend/`:

```bash
npm install
```

```bash
npm run dev
```

Opens on <http://localhost:5173>, which the backend's default
`FRONTEND_ORIGIN` already allows.

`frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Other scripts: `npm run build` (type-check + production bundle),
`npm run preview` (serve the build).

## Screens

| Route | What it does |
| --- | --- |
| `/` | Landing. Particle sphere, name input, routes to `/login`. |
| `/login` | **Demo identity picker** — not authentication. See below. |
| `/dashboard` | Stat tiles with count-up, project grid, new-project modal. |
| `/projects/:id` | Three-column task board, team and resource rails, AI modal. |

### There is no login

The backend has no auth — no endpoint, no session, no token. `/login` fetches
`GET /api/users` and stores the chosen UUID in `localStorage`; it is then sent
as `owner_id` / `assignee_id`. Anyone can pick any identity, and the UI says
so. Replacing this with real auth is a backend change first.

If the picker is empty, seed the database from the repository root:

```bash
python -m backend.seed
```

## How it is put together

```
src/
├── lib/
│   ├── api.ts        fetch wrapper, 10s timeout, ApiError
│   ├── queries.ts    every server call, as TanStack Query hooks
│   └── identity.ts   localStorage demo identity
├── types/api.ts      mirrors backend/schemas.py
├── components/       NotchedCard, Modal, StatTile, primitives, ErrorBoundary
├── features/         landing/ login/ dashboard/ project/
└── routes/           one file per screen, all lazy-loaded
```

**Status and priority are literal unions** (`"To Do" | "In Progress" |
"Completed"`, `"Low" | "Medium" | "High"`). Sending `"todo"` is a compile
error rather than a 422 at runtime.

**Both FastAPI error shapes are handled** — `{detail: string}` and the 422
`{detail: [{loc, msg}]}` array, which is flattened into per-field messages.
`ApiError.friendly` gives a line safe to show for any status.

**Queries never retry a 4xx.** Task status changes are optimistic with
rollback, and any task mutation invalidates the dashboard so the stats cannot
drift.

## Theme

Tokens live on `:root` in `src/index.css`. One gradient ramp
(`cyan → violet → magenta`), weighted toward violet on the landing and cyan in
the app, so both screens read as one product.

- `.notched` / `.notched-sm` — the two-corner-cut card shape. `clip-path`
  removes borders, so gradient hairlines are a 1px padded wrapper.
- `.mono-micro` — uppercase JetBrains Mono, `0.22em` tracking. Every label.
- `.grad-text` — white → pale-cyan display headings.

The particle sphere is **2D canvas, not three.js** — a Fibonacci lattice with
a perspective divide. It pauses on tab blur, scales its point count on small
screens, and renders one static frame under `prefers-reduced-motion`. The app
is wrapped in `<MotionConfig reducedMotion="user">`.

## Verified

Checked against the live backend: identity picker loads real users; project
and task creation; status change moves the card and updates the dashboard
(1 of 4 → 25.0%); AI modal generates, allows deselection, and adds only the
selected tasks; an invalid resource URL surfaces the backend's 422 inline.
`npm run build` passes with per-route code splitting.

## Limitations

- No auth, as above.
- `/api/dashboard` is global — it covers every project in the database, not
  the selected identity's. Labelled "Workspace overview" rather than filtered.
- No delete endpoints exist, so there are no delete controls.
- The AI `source` chip shows `◇ TEMPLATE FALLBACK` until Member 3's Gemini
  implementation lands, at which point it flips to `✦ GEMINI` on its own.
- Status changes use a dropdown, not drag-and-drop.
