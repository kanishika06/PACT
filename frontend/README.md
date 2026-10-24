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
| `/` | Landing. Particle sphere, name input, routes to `/auth`. |
| `/auth` | Sign in / create account / continue with demo. **Demo access, not authentication.** |
| `/story` | Six-scene identity experience with the particle bust. |
| `/login` | Demo identity picker. Kept — binds the session to a seeded backend user. |
| `/dashboard` | Stat tiles with count-up, project grid, new-project modal. |
| `/projects/:id` | Three-column task board, team and resource rails, AI modal. |

### There is no authentication

The backend has no auth — no login endpoint, no password column, no session,
no token. Nothing on `/auth` verifies anyone. What each action really does:

| Action | Actually does |
| --- | --- |
| Create account | `POST /api/users` — a **real row** (name + email). The password is validated for format, then discarded; it is never transmitted or stored. |
| Sign in | `GET /api/users` and matches on email. The password is ignored, because there is nothing to check it against. |
| Continue with demo | Binds to the first seeded user. |

Passwords never reach `localStorage`, `sessionStorage`, or the network. The
screen states all of this in plain language rather than implying a login.

`src/lib/session.ts` is the whole replacement surface for real auth, and it
ends with an `AUTH_CONTRACT` constant naming the endpoints the backend would
need (`/api/auth/signup`, `/login`, `/logout`, `/me`) plus the password
hashing and token verification that go with them.

### The identity story (`/story`)

Six scenes: invitation, instincts, skills workshop, ambition, collaboration
style, reveal. All answers live in one object, so moving backward never loses
a selection, and every change is written to `localStorage` immediately — a
refresh mid-story resumes where you left off.

Adaptation is **deterministic** (`src/features/story/sceneData.ts`): the
scene-4 and scene-5 supporting lines are picked by first-matching-rule from
what was actually selected earlier. No model is called to decide what to show,
and the reveal is assembled from real answers only — unanswered sections read
"Nothing selected" rather than inventing content.

The profile is **not saved to the server**. There is no profile table or
endpoint; the reveal says so on screen. Skipping never blocks the workspace.

The bust silhouette is generated locally: a bezier path in
`ParticleHead.tsx` is rasterised to an offscreen canvas and sampled where
alpha passes a threshold, with a seeded PRNG so the distribution is identical
on every load. Edge pixels are drawn brighter, which produces the rim glow
without a blur pass. No external image is fetched. Pointer parallax is
desktop-only, the point count drops on small screens, rAF stops on tab blur
and unmount, and `prefers-reduced-motion` renders a single static frame.

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

- No auth, as above. `/auth` is demo access and says so on screen.
- **The student profile is browser-only.** No profile endpoint exists, so
  answers do not survive a different browser or device, and nothing claims
  otherwise in the UI.
- **The workspace is dark, not light.** The Phase 3 brief asked for a separate
  light professional mode for the workspace; that was not done, because the
  dark theme comes from the reference images this project was designed to and
  switching it would discard the approved visual system. Raise it if the light
  mode is genuinely wanted — it is a theming change, not a rewrite.
- `prefers-reduced-motion` handling is implemented in every animated surface
  but was **not** verified in a browser; the preview pane cannot emulate it.
- `/api/dashboard` is global — it covers every project in the database, not
  the selected identity's. Labelled "Workspace overview" rather than filtered.
- No delete endpoints exist, so there are no delete controls.
- The AI `source` chip shows `◇ TEMPLATE FALLBACK` until Member 3's Gemini
  implementation lands, at which point it flips to `✦ GEMINI` on its own.
- Status changes use a dropdown, not drag-and-drop.
