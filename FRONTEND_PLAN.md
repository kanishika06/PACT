# TeamSync AI — Frontend Implementation Plan

Target: a reliable, Gen-Z-coded React frontend consuming the FastAPI backend in
`backend/`. Visual language derived from the two supplied references — a
cinematic particle landing, and a dark cyan/violet gradient app shell.

---

## 0. The one thing to decide first

**The backend has no authentication.** There is no login endpoint, no session,
no token. So the "login page" in this plan is a **demo identity picker**: it
calls `GET /api/users`, the user taps a card, and the chosen UUID goes into
`localStorage`. Every later request sends that UUID as `owner_id` /
`assignee_id`.

This is the honest design for the current backend. The screen must be labelled
as demo mode in the UI so nobody at the demo table believes it is secure. If
real auth is wanted later it is a backend change first, and this screen becomes
a real form with almost no visual rework.

---

## 1. Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Build | **Vite + React 18 + TypeScript** | Matches the team agreement; backend CORS already allows `:5173`. TS is what makes it *reliable* — the status/priority literals get caught at compile time. |
| Styling | **Tailwind CSS 3.4** + CSS vars | Design tokens as CSS custom properties, Tailwind for layout speed. v3 over v4 — stable under hackathon pressure. |
| Animation | **Framer Motion** | Layout animations (`layout` prop) give the task-board card-fly for free. |
| Routing | **React Router 6** | |
| Server state | **TanStack Query 5** | Retries, caching, optimistic updates, loading/error states — the reliability layer. Do not hand-roll `useEffect` fetching. |
| Particles | **Canvas 2D** (not three.js) | See §4. |
| UI kit | **none** | A kit fights this theme. Components are ~12 small files. |

```bash
npm create vite@latest frontend -- --template react-ts
```

```bash
npm i react-router-dom @tanstack/react-query framer-motion
```

```bash
npm i -D tailwindcss@3 postcss autoprefixer
```

`frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Never hardcode the backend URL. The backend's `FRONTEND_ORIGIN` already allows
`http://localhost:5173`.

---

## 2. Design tokens

Pulled from the references. The landing leans violet/magenta, the app leans
cyan/teal — **same gradient, different weighting**. That is what makes two very
different screens read as one product.

```css
:root {
  /* surfaces */
  --void:      #05070D;   /* landing outer edges */
  --deep:      #0A1419;   /* app background */
  --panel:     #10202A;   /* inset panel, cards */
  --raised:    #16242E;   /* buttons, hamburger */

  /* accent ramp */
  --cyan:      #2DD4D4;
  --violet:    #7C3AED;
  --magenta:   #C026D3;
  --grad: linear-gradient(135deg, var(--cyan), var(--violet) 60%, var(--magenta));

  /* type */
  --text:      #EAF2F8;
  --muted:     rgba(234, 242, 248, 0.55);
  --faint:     rgba(234, 242, 248, 0.28);
  --hairline:  rgba(124, 58, 237, 0.30);

  /* motion */
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

**Type pairing** (both on Google Fonts, `display=swap`, with `preconnect`):

- Display — **Space Grotesk 300**. Large, light, tight leading (`0.95`).
  Headlines get a subtle `white → pale cyan` gradient via
  `background-clip: text`.
- Micro — **JetBrains Mono 400**, uppercase, `letter-spacing: 0.22em`, 10–11px,
  `--muted`. This is the single most theme-defining detail in both references —
  every label, badge, button and status chip uses it.

**The card shape.** Reference 2's cards are a rounded rect with two *opposite*
corners cut. One utility class, used everywhere:

```css
.notched {
  border-radius: 22px;
  clip-path: polygon(
    26px 0, 100% 0, 100% calc(100% - 26px),
    calc(100% - 26px) 100%, 0 100%, 0 26px
  );
}
```

**Gradient hairline borders** — `clip-path` kills `border`, so use a padded
gradient wrapper: outer div has `background: var(--grad)` and `padding: 1px`,
inner div has `background: var(--panel)`. Inactive cards set the outer to
`opacity: .35`; hover animates to `1`.

---

## 3. Routes and screens

```
/                 Landing      particle hero → name input → /login
/login            Identity     demo-user cards (reference 2 styling)
/dashboard        Overview     stats + project grid
/projects/:id     Workspace    task board, members, resources, AI
```

### `/` — Landing (reference 1)

Full-bleed canvas. HUD anchored to the corners, exactly as in the reference:
logo top-left, mono nav centered, boxed `×` top-right, `PROGRESS` bottom-left,
small mono paragraph bottom-right. Center: display headline + a single
underline-only input, `PRESS ENTER ⏎` beneath it.

Copy: **`TeamSync AI`** / *From Ideas to Execution.* then
"But first — who's building?" with an `Enter your full name` input. Name goes to
`localStorage`, route pushes to `/login`.

### `/login` — Identity picker (reference 2)

This is reference 2 almost literally. Badge `SELECT YOUR IDENTITY`, big light
headline "Who are you building as?", then demo-user cards in the **descending
staircase** — `translateY` of `0, 32, 64, 96…`, with the hovered/selected card
lifted and filled with the gradient. Mono name, muted email beneath.

Data: `GET /api/users`. Empty list is a real possibility — show an empty state
telling them to run `python -m backend.seed`, not a blank screen.

### `/dashboard` — Overview

Top row: four stat tiles from `GET /api/dashboard` (`total_projects`,
`total_tasks`, `completed_tasks`, `completion_percentage`) with count-up
numbers and a thin gradient progress bar on the percentage tile. Below: project
grid from `GET /api/projects`, notched cards, staggered entrance, plus a
`+ NEW PROJECT` card that opens a modal.

Note `pending_tasks` covers both `To Do` and `In Progress` — label it "In
flight", not "Not started", or the number will look wrong.

### `/projects/:id` — Workspace

Three columns — `To Do` / `In Progress` / `Completed` — fed by
`GET /api/projects/{id}/tasks`. Status changes via `PATCH /api/tasks/{id}`.
Side rail for members (`POST .../members`) and resources
(`POST .../resources`). A `GENERATE WITH AI` button opens the AI modal.

---

## 4. The particle hero

**Use Canvas 2D, not three.js.** `@react-three/fiber` + `three` is ~600 KB
gzipped and risks a frame-rate problem on whatever laptop is driving the demo.
A projected point-sphere in 2D canvas gets ~90% of the look in about 60 lines
and ~0 KB of dependency.

Approach: generate N points on a sphere with the Fibonacci lattice, apply a
slow Y rotation plus a sine-based radial wobble, project with a simple
perspective divide, draw as 1–2px `fillRect`, size and alpha scaled by depth.
Separate static starfield layer behind it.

```
count = window.innerWidth < 768 ? 1200 : 3500
```

Mandatory guards, or this will eat the battery and the demo:

- `cancelAnimationFrame` on unmount
- pause on `document.visibilitychange`
- pause when the hero leaves the viewport (`IntersectionObserver`)
- skip entirely under `prefers-reduced-motion` — render one static frame

Upgrade to r3f later only if there is genuinely spare time.

---

## 5. Animation inventory

Specific, so it can be built rather than guessed at. Everything uses
`--ease` = `cubic-bezier(0.22, 1, 0.36, 1)`.

| # | Where | What | Timing |
| --- | --- | --- | --- |
| 1 | Landing | particle sphere rotation + wobble | continuous, ~0.0008 rad/frame |
| 2 | Landing | headline words blur-in, staggered | 40 ms stagger, 600 ms each |
| 3 | Landing | input underline gradient sweep on focus | 400 ms |
| 4 | All | route transition: fade + 8px rise | 400 ms, `AnimatePresence mode="wait"` |
| 5 | Login | cards staircase in, staggered | 60 ms stagger |
| 6 | Login/Dash | card hover: `scale 1.02`, border opacity `.35 → 1`, glow | 250 ms |
| 7 | Dashboard | stat count-up | 1.2 s, `useMotionValue` + `animate` |
| 8 | Dashboard | progress bar fill | 900 ms, delayed 200 ms |
| 9 | Workspace | task card flies between columns on status change | Framer `layout` prop — free |
| 10 | AI modal | backdrop blur-in, panel `scale .96 → 1` | 300 ms |
| 11 | AI modal | suggestions cascade in | 50 ms stagger |
| 12 | Global | `prefers-reduced-motion` → all durations `0.01s` | one hook, applied at the `MotionConfig` level |

Item 12 is not optional. Wrap the app in
`<MotionConfig reducedMotion="user">` and Framer handles most of it.

---

## 6. Reliability layer

This is the part that separates a demo that survives from one that white-screens.

### 6.1 Types mirror the Pydantic schemas exactly

```ts
export type TaskStatus   = 'To Do' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';
```

Exact strings, exact capitalisation. Sending `"todo"` or `"high"` returns 422.
With these as literal unions, TypeScript catches it before the request leaves.

### 6.2 One API client

`src/lib/api.ts` — a single `request()` wrapper that:

- reads the base URL from `import.meta.env.VITE_API_BASE_URL`
- applies a 10 s timeout via `AbortController`
- throws a typed `ApiError` carrying `status` and parsed detail

FastAPI returns **two different error shapes** and both must be handled:

```jsonc
// 404 / 400 / 503
{ "detail": "Project ... not found" }

// 422 validation
{ "detail": [ { "loc": ["body","status"], "msg": "...", "type": "..." } ] }
```

Normalise the 422 array into `Record<field, message>` so forms can show errors
inline rather than dumping JSON.

### 6.3 Status-code handling

| Code | UI response |
| --- | --- |
| 400 | Inline message — "already a member", "email taken" |
| 404 | Route-level not-found panel, link back to dashboard |
| 422 | Field-level errors on the offending input |
| 500 | Generic toast, keep the current view intact |
| 502 | AI modal: "AI returned something unexpected" + retry |
| 503 | AI modal: "AI unavailable right now" + retry; or DB-down banner |

### 6.4 Query configuration

- `retry: (count, err) => count < 2 && err.status >= 500` — never retry a 4xx
- `staleTime: 30_000`
- Invalidate `['dashboard']` after any task mutation, or the stats go stale
- Optimistic update on task status change, with rollback in `onError`

### 6.5 Other guards

- One `<ErrorBoundary>` per route element
- Skeletons, not spinners — reuse the notched card shape so layout does not jump
- Empty states for: no users (prompt to seed), no projects, no tasks in a column
- A small `DB OFFLINE` banner driven by `GET /health/db`, polled every 30 s
- `created_at` has **no UTC offset on SQLite** and an offset on PostgreSQL —
  parse defensively, treat a bare timestamp as UTC

---

## 7. AI generation flow

The endpoint returns suggestions only and **saves nothing**. The UI must honour
that:

1. `POST /api/ai/generate-tasks` with `{ project_title, project_description, team_size }`
2. Suggestions cascade into the modal as checkbox cards, **all selected by default**
3. The user deselects what they do not want
4. `ADD N TASKS` fires one `POST /api/projects/{id}/tasks` per selected item
5. Invalidate tasks + dashboard

Show the `source` field honestly. A small mono chip:
`✦ GEMINI` when `source === "gemini"`, `◇ TEMPLATE` when `"fallback"`. Do not
label fallback output as AI-generated — the backend is careful about this and
the frontend should not undo it.

Note the AI service is currently a placeholder, so `source` will be
`"fallback"` until Member 3 lands the Gemini implementation. The chip will flip
on its own.

---

## 8. Performance

- `React.lazy` per route; the landing's canvas in its own chunk
- Particle count scaled by viewport; rAF paused when hidden (§4)
- Fonts: `preconnect` to `fonts.gstatic.com`, `display=swap`, two weights only
- `React.memo` on task cards; stable `key` by task id
- No layout animation on lists over ~50 items
- Target: landing interactive < 1.5 s, dashboard < 800 ms on a warm cache

---

## 9. File structure

```
frontend/
├── .env                      VITE_API_BASE_URL
├── index.html                fonts, preconnect
├── tailwind.config.js        tokens → theme.extend
└── src/
    ├── main.tsx              QueryClient, Router, MotionConfig
    ├── index.css             :root tokens, .notched, base
    ├── lib/
    │   ├── api.ts            request(), ApiError
    │   ├── queries.ts        all useQuery/useMutation hooks
    │   └── identity.ts       localStorage demo user
    ├── types/api.ts          mirrors backend/schemas.py
    ├── components/
    │   ├── NotchedCard.tsx   gradient border + clip-path
    │   ├── MonoLabel.tsx     the uppercase micro-type
    │   ├── GradientText.tsx
    │   ├── StatTile.tsx      count-up
    │   ├── TaskCard.tsx
    │   ├── Skeleton.tsx
    │   ├── Modal.tsx
    │   └── ErrorBoundary.tsx
    ├── features/
    │   ├── landing/ParticleField.tsx
    │   ├── login/IdentityPicker.tsx
    │   ├── dashboard/
    │   └── project/AiTaskModal.tsx
    └── routes/
        ├── Landing.tsx
        ├── Login.tsx
        ├── Dashboard.tsx
        └── Project.tsx
```

---

## 10. Build order

**Build the working app before the beautiful landing.** The landing is the most
fun and the least load-bearing; if time runs out it should be the thing that is
unfinished, not the dashboard.

| Phase | Time | Scope |
| --- | --- | --- |
| **P0 — spine** | ~45 min | Scaffold, tokens, fonts, `api.ts`, types, router, `NotchedCard`, identity picker against real `/api/users`, dashboard stats + project list. *Milestone: real backend data on screen in-theme.* |
| **P1 — function** | ~45 min | Project workspace, task board, create project, create/update task, AI modal end to end. *Milestone: the full demo path works.* |
| **P2 — spectacle** | ~30 min | Particle hero, headline stagger, route transitions, card hover. |
| **P3 — hardening** | ~30 min | Skeletons, empty + error states, reduced motion, responsive, DB banner. |

Cut-lines if short on time: drop resources UI, drop the members rail, drop
drag-and-drop in favour of a status dropdown on each card. Do **not** cut the
error states or the identity picker.

---

## 11. Backend endpoint reference

Everything below is implemented and live.

| Method | Path | Used by |
| --- | --- | --- |
| GET | `/health`, `/health/db` | offline banner |
| GET | `/api/users` | identity picker |
| POST | `/api/users` | optional "create me" |
| GET | `/api/projects` | dashboard grid |
| POST | `/api/projects` | new-project modal (needs `owner_id`) |
| GET | `/api/projects/{id}` | workspace header |
| PATCH | `/api/projects/{id}` | rename / edit description |
| GET POST | `/api/projects/{id}/members` | members rail |
| GET POST | `/api/projects/{id}/tasks` | task board |
| PATCH | `/api/tasks/{id}` | status, assignee, priority, due date |
| GET POST | `/api/projects/{id}/resources` | resources rail |
| GET | `/api/dashboard` | stat tiles |
| POST | `/api/ai/generate-tasks` | AI modal |

Swagger: <http://127.0.0.1:8000/docs>

---

## 12. Known constraints

- **No auth** — `/login` is a demo identity picker, must be labelled as such.
- **Dashboard is global** — stats cover every project in the database, not the
  selected identity's. Either label it "Workspace overview" or filter
  client-side by `owner_id` and stop calling `/api/dashboard`.
- **No delete endpoints** — do not design delete buttons.
- **AI returns `"fallback"`** until Member 3's Gemini work lands.
- **Supabase is unverified** — the backend has only been tested on SQLite, so
  the frontend may be the first thing to hit a real PostgreSQL quirk.
