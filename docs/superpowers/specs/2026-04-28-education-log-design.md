# Education Log — Design Spec

**Date:** 2026-04-28
**Status:** Draft for review
**Repo:** `education-log` (public, GitHub)

## 1. Purpose & Scope

A private, login-gated personal dashboard tracking the user's post-bachelor education since arriving in the US. Covers current and planned programs (degrees + certificates), the courses within each, and the artifacts associated with them (syllabus PDFs, GitHub project links, notes).

The site is read-mostly for the owner: occasionally add or edit entries, frequently glance at progress and history. It is not a public showcase, not a portfolio, not multi-user. It exists so the owner doesn't have to remember what they took, when, with whom, and what they got.

**In scope:** logging completed, in-progress, and planned courses across multiple programs. Storing per-course metadata (term, instructor, grade, syllabus, code link, note). Computing per-program GPA based on a per-program grading scale.

**Explicitly out of scope:** degree-requirement tracking, schedule conflict detection, course-catalog import, public sharing, multi-user, mobile native app, charts, search, filters, tags, long reflections, CSV/JSON import-export.

## 2. Architecture

```
Browser  ──── React SPA (built with Vite, TypeScript)
   │
   │ Supabase JS SDK over HTTPS
   ▼
Supabase Cloud (free tier)
  ├── Auth         (email + password; reset via email)
  ├── Postgres     (program + course tables; RLS enforced)
  └── Storage      (private "syllabi" bucket; signed URLs)

Hosting:  GitHub Pages, served from gh-pages branch
Deploy:   GitHub Action on push to main (vite build → publish dist/)
```

**Why this shape**
- Static frontend = free hosting (GitHub Pages), no server to maintain.
- Supabase delivers the three things otherwise built from scratch: auth, relational DB, file storage.
- RLS in Postgres is the security boundary. The Supabase anon key is bundled into the JS (it has to be — there's no server to hide it on); RLS is what prevents an unauthenticated visitor from reading or writing data through the public API.

## 3. Data Model

### Postgres tables

**`program`** — one row per degree or certificate.

| field | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | always `auth.uid()`; for RLS |
| abbreviation | text | display label, e.g., "UChicago MSFM" |
| full_name | text | "Master of Science in Financial Mathematics" |
| institution | text | "University of Chicago" |
| kind | enum (`degree`, `certificate`) | display badge |
| start_date | date | |
| end_date | date | nullable (in-progress / planned) |
| status | enum (`completed`, `in_progress`, `planned`) | |
| description | text | optional, 1–2 sentences |
| grading_scale | jsonb | ordered array; see below |
| display_order | int | manual sort (default = chronological by start_date) |
| created_at, updated_at | timestamptz | |

`grading_scale` shape:
```json
[
  {"letter": "A",  "gpa": 4.00},
  {"letter": "A-", "gpa": 3.67},
  {"letter": "B+", "gpa": 3.33},
  {"letter": "P",  "gpa": null},
  {"letter": "F",  "gpa": 0.00}
]
```
Letters with `gpa: null` are excluded from GPA computation entirely — courses graded with such a letter contribute neither to the numerator nor to the denominator (their credits are not counted).

**`course`** — one row per course, FK to program.

| field | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | for RLS |
| program_id | uuid FK → program | cascade delete |
| code | text | "FinM 34500" |
| name | text | "Stochastic Calculus" |
| term_year | int | 4-digit year, e.g., 2023 |
| term_season | enum (`autumn`, `winter`, `spring`, `summer`) | |
| status | enum (`planned`, `in_progress`, `completed`) | |
| type | enum (`credit`, `audit`, `self_study`) | |
| instructor | text | optional |
| credits | numeric | optional |
| grade | text | optional; only when `type=credit` and `status=completed`; must match a `letter` in the parent program's `grading_scale` |
| syllabus_path | text | optional, points to Storage path |
| github_url | text | optional |
| note | text | optional one-liner |
| created_at, updated_at | timestamptz | |

### Storage

- **Bucket:** `syllabi`, private.
- **Path convention:** `<user_id>/<course_id>.pdf`.
- **Access:** frontend requests short-lived signed URLs to render PDF links.

### RLS policies

- `program`: `select|insert|update|delete` permitted iff `user_id = auth.uid()`.
- `course`: same.
- `syllabi` storage: file path must start with `auth.uid()/`.

### Computed values (client-side, not stored)

- **Per-program GPA:** weighted average of `course.grade → grading_scale.gpa` over courses where `type=credit` and `status=completed`, weighted by `credits` (default weight 1 if `credits` is null). Letters mapping to `null` excluded.
- **Header stats:** total programs, total courses, count of *courses* in `in_progress` status, count of *courses* in `planned` status.

No cumulative cross-program GPA — meaningless across institutions with different grading scales.

## 4. Page UX

Two routes total: `/login` (public) and `/` (authenticated).

### Login screen

Centered serif card on cream background:

```
                  Education Log
            ──────────────────────
            email:    [_________]
            password: [_________]
                         [ Sign in ]

                forgot password?
```

- "Sign in" → Supabase email/password auth.
- "forgot password?" → form to enter email → Supabase sends reset link → click link → "set new password" page → submit → signed in.
- **One-time signup**: account created once via Supabase dashboard. After that, sign-up is disabled at the Supabase project level (Settings → Auth → "Allow new users to sign up" = off).

### Main page

Single scrollable page, academic-minimal aesthetic (cream background, serif typography, restrained palette, subtle borders).

**Header strip**

```
Dafu Zhu — Education Log
4 programs · 47 courses · 3 in progress · 5 planned     [+ Add program]
```

**Program sections** — rendered in `display_order` (default chronological). For each program:

```
─────────────────────────────────────────────────────────────
UCHICAGO MSFM    Degree · 2022–2023 · GPA 3.92
Master of Science in Financial Mathematics
University of Chicago
[optional 1–2 sentence description]

  FinM 34500    Stochastic Calculus           Roger Lee
                Autumn 2023                          A · 100 cr  📄 ⌘
  FinM 33170    Statistical Risk Management   ...
                Winter 2023                          A- · 100 cr 📄

                                              [+ Add course]
```

**Course row** (single-column, transcript-style; not a card grid):
- Line 1: code · name · instructor
- Line 2: term · grade · credits · type-tag (only if not Credit) · inline icons (📄 syllabus, `<>` GitHub) when present

**Visual state by status**
- *Completed* — full opacity, normal weight.
- *In progress* — same opacity; small italic *"in progress"* tag in the grade slot.
- *Planned* — slightly lighter text color, italic *"planned"* tag, no grade column.

**Click a course row** → expand inline below the row to show the optional `note`, syllabus PDF link (opens in new tab), and GitHub link. Click again → collapse. No modal for view.

**Edit affordances** — tiny `edit` icon on hover (desktop) or always-visible (mobile) next to each course row and program header.

**Footer** — *"Last updated YYYY-MM-DD · Log out"*. The date is `MAX(updated_at)` across all the user's program and course rows. Subtle styling.

### Empty states

- No programs → centered serif message *"Add your first program to get started"* + button.
- Program with no courses → small italic *"No courses added yet"* under the program header + `+ Add course` button.

### Mobile

Single column anyway. Course row collapses into stacked lines (code/name/instructor, then term/grade/credits/icons).

## 5. Editing Flow

All edits happen on the same page via modals. No separate `/admin` route.

### Add / edit program (modal)

Fields: abbreviation, full name, institution, kind (Degree/Certificate), start_date, end_date, status, description, grading_scale, display_order.

**Grading scale editor:**
- Dropdown labeled *"Start from template:"* — options:
  - **US Standard 4.0** (A through F with pluses/minuses; A caps at 4.0, no A+)
  - **Plus-weighted 4.33** (adds A+ = 4.33)
  - **Pass / Fail** (P, NP — both `gpa: null`)
  - **Custom (blank)**
- Picking a template populates a small editable table of `{letter, gpa}` rows.
- User can add/edit/delete rows before saving. Stored as JSONB on the program.

Footer of edit modal: **Delete program** link → confirmation prompt warning all child courses will be cascade-deleted.

### Add / edit course (modal)

Fields: code, name, term_year, term_season, status, type, instructor, credits, grade, syllabus_path (file upload), github_url, note.

- **`grade` dropdown** is populated from the parent program's `grading_scale.letter` values. Disabled when `type ≠ credit` or `status ≠ completed`.
- **Syllabus upload** — file input, accepts PDF only. On save: file uploads to `syllabi/<user_id>/<course_id>.pdf`, path stored in `syllabus_path`. Replacing the file deletes the old object.
- Validation: required fields enforced; `term_year` is a 4-digit int; `grade` must be in program's `grading_scale` (or null when not applicable).

Footer: **Delete course** link → confirmation prompt.

### Modal styling

Plain serif forms. Required fields marked with a small `*`. No fancy multi-step wizards.

## 6. Auth & Security

- **Auth:** Supabase email + password.
- **Reset:** Supabase password-reset flow via email.
- **Single-user lockdown:** signup disabled at the Supabase project level after one-time account creation.
- **Session:** Supabase default, ~30 days, auto-refresh.
- **RLS:** every table policy checks `user_id = auth.uid()`.
- **Storage:** `syllabi` bucket private; signed URLs only; path-prefix RLS.
- **Transport:** HTTPS enforced by Supabase. CORS allow-list = the GitHub Pages URL only.
- **Anon key:** bundled in JS — RLS is the actual security boundary.

## 7. Repo & Deployment

### Repo

- **Name:** `education-log`
- **Visibility:** public
- **License:** MIT
- **Top-level structure:**
  ```
  /src                 React app source (TypeScript)
  /supabase
    /migrations        versioned SQL (schema, RLS policies)
    /seed.sql          minimal seed (none required)
  /.github/workflows
    deploy.yml         build + publish to gh-pages
  /docs
    /superpowers/specs this design doc lives here
  README.md            setup instructions
  .gitignore
  ```

### GitHub Action (`deploy.yml`)

On push to `main`:
1. `npm ci`
2. `npm run build` (Vite outputs to `dist/`)
3. Publish `dist/` to `gh-pages` branch (via `peaceiris/actions-gh-pages` or equivalent)

### GitHub Pages

- Source: `gh-pages` branch
- Default URL: `https://dafu-zhu.github.io/education-log/`

### Environment variables

GitHub Action secrets, injected at build time:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase project

- Free tier, region close to user (US East).
- Schema and RLS policies versioned as SQL migrations under `/supabase/migrations/`.
- Initial setup is a one-time manual step (create project, run migrations, create the user account, disable signups, configure CORS).

## 8. Testing & Quality

- **Unit tests:** the GPA computation only (letter→numeric mapping, weighted average, exclusion of null-gpa letters). Rest is UI glue and is verified manually.
- **Type safety:** TypeScript across the app. Use Supabase's generated `Database` type so queries are checked at build time.
- **Linting:** ESLint + Prettier defaults.
- **Manual browser testing:** the primary verification path. The whole authenticated experience is one page; a few minutes of clicking through covers it.

## 9. Out of Scope (YAGNI)

Confirmed not in v1:

- CSV / JSON import or export
- Charts (GPA trend, completion bars)
- Search bar
- Filters by status, type, term
- Tags / topics
- Multi-paragraph notes / reflections per course
- Multi-user, sharing, public read-only links
- Offline support / PWA
- Mobile native app
- Degree-requirement tracking / what-if planning
- Course-catalog imports

These can be revisited if the v1 reveals a real itch.

## 10. Open Operational Questions (resolve during implementation, not now)

- Custom domain vs default `*.github.io/education-log/` — defer until deployed.
- Specific React component library (or none) — likely no library; serif aesthetic is easier with hand-rolled CSS than overriding a UI kit.
- PDF preview vs link-out — start with link-out (open in new tab); revisit if it feels clunky.
