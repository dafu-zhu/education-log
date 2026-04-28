# Education Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, login-gated personal dashboard for tracking the user's post-bachelor education in the US — current and planned programs, the courses within them, syllabi PDFs, GitHub project links, and per-program GPA.

**Architecture:** A Vite + React + TypeScript single-page app deployed to GitHub Pages, talking directly to Supabase (Auth + Postgres + Storage) over HTTPS. Single user; security enforced by Supabase Row-Level Security policies that gate every row by `auth.uid()`.

**Tech Stack:** Vite, React 18, TypeScript, Supabase JS SDK v2, Vitest (unit tests for GPA logic), ESLint + Prettier, GitHub Actions for build & deploy.

**Spec:** [`docs/superpowers/specs/2026-04-28-education-log-design.md`](../specs/2026-04-28-education-log-design.md)

---

## Prerequisites (one-time manual setup the operator does)

1. Node 20+ and npm installed.
2. `gh` CLI authenticated (`gh auth status` returns "Logged in").
3. A Supabase account on the free tier — you'll create the project in Phase 1.
4. The repo already exists locally at `D:/GitHub/education-log/` with the spec committed (this plan assumes that's done).

---

## File Structure (target after the plan completes)

```
education-log/
├── .github/workflows/
│   └── deploy.yml                       # Build + deploy to GitHub Pages
├── docs/superpowers/
│   ├── specs/2026-04-28-education-log-design.md
│   └── plans/2026-04-28-education-log-implementation.md
├── public/
│   └── favicon.svg                      # Tiny serif-styled favicon
├── src/
│   ├── lib/
│   │   ├── supabase.ts                  # Supabase client singleton
│   │   ├── gpa.ts                       # Pure GPA computation (TDD)
│   │   └── grading-scales.ts            # Preset templates
│   ├── auth/
│   │   ├── AuthProvider.tsx             # Session context
│   │   ├── LoginPage.tsx                # Email/password sign-in + forgot link
│   │   └── ResetPasswordPage.tsx        # Set new password after email click
│   ├── api/
│   │   ├── programs.ts                  # CRUD for programs
│   │   ├── courses.ts                   # CRUD for courses
│   │   └── storage.ts                   # Upload PDF + signed URLs
│   ├── components/
│   │   ├── Header.tsx                   # Top strip (name, stats, +Add program)
│   │   ├── Footer.tsx                   # Last updated + log out
│   │   ├── ProgramSection.tsx           # One program block
│   │   ├── ProgramHeader.tsx            # Abbrev, badge, GPA, edit affordance
│   │   ├── CourseRow.tsx                # Transcript-style row + expand
│   │   ├── ProgramFormModal.tsx         # Add/edit program
│   │   ├── CourseFormModal.tsx          # Add/edit course
│   │   ├── GradingScaleEditor.tsx       # Preset selector + table editor
│   │   ├── Modal.tsx                    # Generic modal wrapper
│   │   └── icons.tsx                    # Tiny inline SVGs (PDF, GitHub, edit, plus)
│   ├── pages/
│   │   └── HomePage.tsx                 # Authenticated single page
│   ├── types.ts                         # Domain types (Program, Course, etc.)
│   ├── App.tsx                          # Top-level router
│   ├── main.tsx                         # React entry
│   ├── index.css                        # Global academic-minimal theme
│   └── vite-env.d.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20260428000001_schema.sql
│   │   ├── 20260428000002_rls.sql
│   │   └── 20260428000003_storage.sql
│   └── README.md                        # How to apply migrations
├── tests/
│   └── gpa.test.ts                      # Vitest unit tests
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc
├── .env.example
├── .gitignore                           # already exists
└── README.md
```

---

## Phase 0 — Project Scaffold

### Task 1: Scaffold Vite React TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/index.css`, `public/vite.svg`

- [ ] **Step 1: Scaffold via Vite**

Run from `D:/GitHub/education-log/`:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted "Current directory is not empty. Remove existing files and continue?" answer **No / Ignore files and continue**. Vite will create scaffold files alongside the existing `.git` and `docs/`.

Expected: `package.json`, `index.html`, `src/`, `tsconfig.*` files appear.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` populated, `package-lock.json` created.

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: prints `Local: http://localhost:5173/`. Open in browser to see Vite + React default page. Stop the server with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Install runtime + dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Supabase JS SDK**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Install Vitest and React Testing Library (for the GPA unit tests only)**

```bash
npm install -D vitest @vitest/ui jsdom
```

- [ ] **Step 3: Install Prettier**

```bash
npm install -D prettier
```

(ESLint config came with the Vite template.)

- [ ] **Step 4: Add `test` script to `package.json`**

In `package.json`, add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add Supabase SDK, Vitest, Prettier"
```

---

### Task 3: Configure Vite for GitHub Pages base path + Vitest

**Files:**
- Modify: `vite.config.ts`
- Create: `.prettierrc`

- [ ] **Step 1: Replace `vite.config.ts` contents**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path matches the GitHub Pages sub-path: https://<user>.github.io/education-log/
export default defineConfig({
  plugins: [react()],
  base: '/education-log/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 2: Create `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
```

- [ ] **Step 3: Format the codebase**

```bash
npx prettier --write .
```

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts .prettierrc
git add -u
git commit -m "chore: configure Vite base path, Vitest, Prettier"
```

---

### Task 4: Set up environment variable scaffolding

**Files:**
- Create: `.env.example`, `.env.local`
- Modify: `src/vite-env.d.ts`

- [ ] **Step 1: Create `.env.example`** (template, committed)

```
# Supabase project URL — fill in from Supabase dashboard → Settings → API
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co

# Supabase anon (public) key — safe to expose; RLS is the security boundary
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

- [ ] **Step 2: Create `.env.local`** (real values, gitignored — `.gitignore` already excludes `.env.local`)

```
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder
```

(You'll fill the real values in Phase 1, Task 7.)

- [ ] **Step 3: Type the env vars in `src/vite-env.d.ts`**

Replace the file contents with:
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 4: Commit**

```bash
git add .env.example src/vite-env.d.ts
git commit -m "chore: scaffold env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)"
```

---

## Phase 1 — Supabase Backend

### Task 5: Create Supabase project (manual)

**This task has no code; it sets up the cloud project.**

- [ ] **Step 1: Create the project**

In a browser, go to https://app.supabase.com → New project. Name it `education-log`. Region: closest to you (e.g., `East US (Ohio)` for North America). Database password: generate and save in your password manager.

- [ ] **Step 2: Wait for provisioning** (~2 minutes)

- [ ] **Step 3: Capture project URL and anon key**

Settings → API. Copy:
- Project URL (e.g., `https://abcd1234.supabase.co`)
- anon/public key (a long JWT-like string)

Save these somewhere; you'll paste them into `.env.local` later (Task 7) and into GitHub Action secrets later (Task 30).

---

### Task 6: Write and apply database migrations

**Files:**
- Create: `supabase/migrations/20260428000001_schema.sql`
- Create: `supabase/migrations/20260428000002_rls.sql`
- Create: `supabase/migrations/20260428000003_storage.sql`
- Create: `supabase/README.md`

- [ ] **Step 1: Create `supabase/migrations/20260428000001_schema.sql`**

```sql
-- Enums
create type program_kind as enum ('degree', 'certificate');
create type lifecycle_status as enum ('completed', 'in_progress', 'planned');
create type course_type as enum ('credit', 'audit', 'self_study');
create type term_season as enum ('autumn', 'winter', 'spring', 'summer');

-- Programs
create table public.program (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  abbreviation    text not null,
  full_name       text not null,
  institution     text not null,
  kind            program_kind not null,
  start_date      date not null,
  end_date        date,
  status          lifecycle_status not null,
  description     text,
  grading_scale   jsonb not null default '[]'::jsonb,
  display_order   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index program_user_idx on public.program(user_id);

-- Courses
create table public.course (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  program_id      uuid not null references public.program(id) on delete cascade,
  code            text not null,
  name            text not null,
  term_year       int not null check (term_year between 1900 and 2100),
  term_season     term_season not null,
  status          lifecycle_status not null,
  type            course_type not null,
  instructor      text,
  credits         numeric,
  grade           text,
  syllabus_path   text,
  github_url      text,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index course_user_idx on public.course(user_id);
create index course_program_idx on public.course(program_id);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger program_updated_at before update on public.program
  for each row execute function set_updated_at();
create trigger course_updated_at before update on public.course
  for each row execute function set_updated_at();
```

- [ ] **Step 2: Create `supabase/migrations/20260428000002_rls.sql`**

```sql
-- Enable RLS
alter table public.program enable row level security;
alter table public.course enable row level security;

-- Programs: only the owner can do anything
create policy "program_select_own" on public.program
  for select using (user_id = auth.uid());
create policy "program_insert_own" on public.program
  for insert with check (user_id = auth.uid());
create policy "program_update_own" on public.program
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "program_delete_own" on public.program
  for delete using (user_id = auth.uid());

-- Courses: same pattern
create policy "course_select_own" on public.course
  for select using (user_id = auth.uid());
create policy "course_insert_own" on public.course
  for insert with check (user_id = auth.uid());
create policy "course_update_own" on public.course
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "course_delete_own" on public.course
  for delete using (user_id = auth.uid());
```

- [ ] **Step 3: Create `supabase/migrations/20260428000003_storage.sql`**

```sql
-- Create the syllabi bucket (private)
insert into storage.buckets (id, name, public)
values ('syllabi', 'syllabi', false)
on conflict (id) do nothing;

-- RLS: a user can only touch files under their own auth.uid() prefix.
-- Path convention: <user_id>/<course_id>.pdf
create policy "syllabi_select_own" on storage.objects
  for select using (
    bucket_id = 'syllabi'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "syllabi_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'syllabi'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "syllabi_update_own" on storage.objects
  for update using (
    bucket_id = 'syllabi'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "syllabi_delete_own" on storage.objects
  for delete using (
    bucket_id = 'syllabi'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

- [ ] **Step 4: Create `supabase/README.md`**

```markdown
# Supabase Migrations

These SQL files define the schema, RLS policies, and storage bucket
for the education-log project.

## Applying migrations

The simplest way (no Supabase CLI required) is to paste each file into
the Supabase dashboard SQL Editor and run them in order:

1. Go to your project → SQL Editor → New query.
2. Open `migrations/20260428000001_schema.sql`, paste, click "Run".
3. Repeat for `20260428000002_rls.sql` and `20260428000003_storage.sql`.

Always run them in numeric order. Each migration is idempotent enough
to re-run on a clean database, but not on a populated one — they will
error if a type or table already exists.
```

- [ ] **Step 5: Apply the three migrations in the Supabase dashboard**

In a browser: open Supabase project → SQL Editor → New query. Paste contents of `20260428000001_schema.sql`, click Run. Confirm success ("Success. No rows returned"). Repeat for `_rls.sql` and `_storage.sql`.

- [ ] **Step 6: Verify schema in dashboard**

Table Editor → confirm `program` and `course` tables exist with all columns. Storage → confirm `syllabi` bucket exists and is private.

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat(db): schema, RLS policies, syllabi storage bucket"
```

---

### Task 7: Create the single user account and lock down signups

**This task has no code; it provisions the only user.**

- [ ] **Step 1: Create the account in the Supabase dashboard**

Authentication → Users → "Add user" → "Create new user". Enter your email (e.g., `dafuzhu@uchicago.edu`) and a password. Set `Email Confirm` = true (skip email verification — you control the account).

- [ ] **Step 2: Disable signups**

Authentication → Providers → Email → toggle **Enable email signup** = OFF. Save. (Email sign-IN remains enabled; only sign-UP is disabled.)

- [ ] **Step 3: Configure CORS allowed origins**

Settings → API → "Additional allowed origins":
- Add `http://localhost:5173` (Vite dev server)
- Add `https://YOUR-GITHUB-USERNAME.github.io` (replace with yours)

- [ ] **Step 4: Update `.env.local` with real credentials**

Open `.env.local` and replace the placeholder values with the URL and anon key from Task 5, Step 3.

(No commit — `.env.local` is gitignored.)

---

## Phase 2 — Domain Types & Supabase Client

### Task 8: Define TypeScript domain types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
// Domain types — kept in sync with supabase/migrations/20260428000001_schema.sql.
// If you change the schema, update this file too.

export type ProgramKind = 'degree' | 'certificate';
export type LifecycleStatus = 'completed' | 'in_progress' | 'planned';
export type CourseType = 'credit' | 'audit' | 'self_study';
export type TermSeason = 'autumn' | 'winter' | 'spring' | 'summer';

export interface GradeMapping {
  letter: string;
  gpa: number | null; // null = excluded from GPA (Pass, NP, etc.)
}

export type GradingScale = GradeMapping[];

export interface Program {
  id: string;
  user_id: string;
  abbreviation: string;
  full_name: string;
  institution: string;
  kind: ProgramKind;
  start_date: string; // ISO date "YYYY-MM-DD"
  end_date: string | null;
  status: LifecycleStatus;
  description: string | null;
  grading_scale: GradingScale;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  program_id: string;
  code: string;
  name: string;
  term_year: number;
  term_season: TermSeason;
  status: LifecycleStatus;
  type: CourseType;
  instructor: string | null;
  credits: number | null;
  grade: string | null;
  syllabus_path: string | null;
  github_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// Form input shapes — what the UI passes to api functions before id/timestamps exist.
export type ProgramInput = Omit<Program, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type CourseInput = Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): domain types for Program, Course, GradingScale"
```

---

### Task 9: Create the Supabase client singleton

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Write `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check .env.local.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: Supabase client singleton"
```

---

## Phase 3 — GPA Computation (TDD)

### Task 10: Write failing tests for GPA computation

**Files:**
- Create: `tests/gpa.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect } from 'vitest';
import { computeGpa } from '../src/lib/gpa';
import type { Course, GradingScale } from '../src/types';

const usStandard: GradingScale = [
  { letter: 'A', gpa: 4.0 },
  { letter: 'A-', gpa: 3.7 },
  { letter: 'B+', gpa: 3.3 },
  { letter: 'B', gpa: 3.0 },
  { letter: 'P', gpa: null },
  { letter: 'F', gpa: 0.0 },
];

const make = (overrides: Partial<Course>): Course => ({
  id: 'c',
  user_id: 'u',
  program_id: 'p',
  code: 'X 100',
  name: 'X',
  term_year: 2023,
  term_season: 'autumn',
  status: 'completed',
  type: 'credit',
  instructor: null,
  credits: 100,
  grade: 'A',
  syllabus_path: null,
  github_url: null,
  note: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

describe('computeGpa', () => {
  it('returns null when there are no eligible courses', () => {
    expect(computeGpa([], usStandard)).toBeNull();
  });

  it('returns the single grade when only one credited completed course exists', () => {
    expect(computeGpa([make({ grade: 'A-' })], usStandard)).toBeCloseTo(3.7);
  });

  it('weights by credits when computing the average', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),  // 4.0 * 100 = 400
      make({ id: '2', grade: 'B', credits: 50 }),   // 3.0 * 50  = 150
    ]; // total = 550 / 150 credits = 3.6667
    expect(computeGpa(courses, usStandard)).toBeCloseTo(3.6667, 3);
  });

  it('treats null credits as weight 1', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: null }), // 4.0 * 1
      make({ id: '2', grade: 'B', credits: null }), // 3.0 * 1
    ]; // (4 + 3) / 2 = 3.5
    expect(computeGpa(courses, usStandard)).toBe(3.5);
  });

  it('excludes courses whose grade maps to null gpa (Pass)', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: 'P', credits: 100 }), // excluded entirely
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });

  it('excludes courses with type !== credit', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: 'A', credits: 100, type: 'audit' }),
      make({ id: '3', grade: 'A', credits: 100, type: 'self_study' }),
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });

  it('excludes courses with status !== completed', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: 'A', credits: 100, status: 'in_progress' }),
      make({ id: '3', grade: 'A', credits: 100, status: 'planned' }),
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });

  it('excludes courses with null grade', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: null, credits: 100 }),
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });

  it('excludes courses with a grade not in the scale', () => {
    const courses = [
      make({ id: '1', grade: 'A', credits: 100 }),
      make({ id: '2', grade: 'XYZ', credits: 100 }),
    ];
    expect(computeGpa(courses, usStandard)).toBe(4.0);
  });
});
```

- [ ] **Step 2: Run the tests; verify they all fail**

```bash
npm test
```

Expected: 9 failures, all complaining that `computeGpa` is not exported from `../src/lib/gpa`.

---

### Task 11: Implement GPA computation to make tests pass

**Files:**
- Create: `src/lib/gpa.ts`

- [ ] **Step 1: Write the minimal implementation**

```ts
import type { Course, GradingScale } from '../types';

/**
 * Compute the GPA for a set of courses against a program's grading scale.
 * Returns null when there are no eligible courses.
 *
 * Eligibility: status === 'completed' AND type === 'credit' AND grade
 * exists in the scale AND that letter's gpa is not null.
 *
 * Weight: course.credits, defaulting to 1 when null.
 */
export function computeGpa(
  courses: Course[],
  scale: GradingScale,
): number | null {
  const lookup = new Map<string, number>();
  for (const { letter, gpa } of scale) {
    if (gpa !== null) lookup.set(letter, gpa);
  }

  let totalPoints = 0;
  let totalWeight = 0;

  for (const c of courses) {
    if (c.status !== 'completed') continue;
    if (c.type !== 'credit') continue;
    if (c.grade === null) continue;
    const gpa = lookup.get(c.grade);
    if (gpa === undefined) continue;

    const weight = c.credits ?? 1;
    totalPoints += gpa * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  return totalPoints / totalWeight;
}
```

- [ ] **Step 2: Run the tests; verify they all pass**

```bash
npm test
```

Expected: 9 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/gpa.test.ts src/lib/gpa.ts
git commit -m "feat: GPA computation with weighted average and null-gpa exclusion"
```

---

## Phase 4 — Grading Scale Presets

### Task 12: Define grading scale templates

**Files:**
- Create: `src/lib/grading-scales.ts`

- [ ] **Step 1: Write `src/lib/grading-scales.ts`**

```ts
import type { GradingScale } from '../types';

export interface GradingScalePreset {
  id: string;
  label: string;
  scale: GradingScale;
}

export const GRADING_SCALE_PRESETS: GradingScalePreset[] = [
  {
    id: 'us-standard-4',
    label: 'US Standard 4.0',
    scale: [
      { letter: 'A', gpa: 4.0 },
      { letter: 'A-', gpa: 3.7 },
      { letter: 'B+', gpa: 3.3 },
      { letter: 'B', gpa: 3.0 },
      { letter: 'B-', gpa: 2.7 },
      { letter: 'C+', gpa: 2.3 },
      { letter: 'C', gpa: 2.0 },
      { letter: 'C-', gpa: 1.7 },
      { letter: 'D+', gpa: 1.3 },
      { letter: 'D', gpa: 1.0 },
      { letter: 'F', gpa: 0.0 },
    ],
  },
  {
    id: 'plus-weighted-4-33',
    label: 'Plus-weighted 4.33 (with A+)',
    scale: [
      { letter: 'A+', gpa: 4.33 },
      { letter: 'A', gpa: 4.0 },
      { letter: 'A-', gpa: 3.67 },
      { letter: 'B+', gpa: 3.33 },
      { letter: 'B', gpa: 3.0 },
      { letter: 'B-', gpa: 2.67 },
      { letter: 'C+', gpa: 2.33 },
      { letter: 'C', gpa: 2.0 },
      { letter: 'C-', gpa: 1.67 },
      { letter: 'D+', gpa: 1.33 },
      { letter: 'D', gpa: 1.0 },
      { letter: 'F', gpa: 0.0 },
    ],
  },
  {
    id: 'pass-fail',
    label: 'Pass / Fail',
    scale: [
      { letter: 'P', gpa: null },
      { letter: 'NP', gpa: null },
    ],
  },
  {
    id: 'custom',
    label: 'Custom (blank)',
    scale: [],
  },
];
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/grading-scales.ts
git commit -m "feat: grading scale preset templates"
```

---

## Phase 5 — Data API Layer

### Task 13: Programs API

**Files:**
- Create: `src/api/programs.ts`

- [ ] **Step 1: Write `src/api/programs.ts`**

```ts
import { supabase } from '../lib/supabase';
import type { Program, ProgramInput } from '../types';

export async function listPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('program')
    .select('*')
    .order('display_order', { ascending: true })
    .order('start_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Program[];
}

export async function createProgram(input: ProgramInput): Promise<Program> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('program')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Program;
}

export async function updateProgram(
  id: string,
  patch: Partial<ProgramInput>,
): Promise<Program> {
  const { data, error } = await supabase
    .from('program')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Program;
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase.from('program').delete().eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/programs.ts
git commit -m "feat(api): programs CRUD"
```

---

### Task 14: Courses API

**Files:**
- Create: `src/api/courses.ts`

- [ ] **Step 1: Write `src/api/courses.ts`**

```ts
import { supabase } from '../lib/supabase';
import type { Course, CourseInput } from '../types';

export async function listCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('course')
    .select('*')
    .order('term_year', { ascending: true })
    .order('term_season', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('course')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

export async function updateCourse(
  id: string,
  patch: Partial<CourseInput>,
): Promise<Course> {
  const { data, error } = await supabase
    .from('course')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('course').delete().eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/courses.ts
git commit -m "feat(api): courses CRUD"
```

---

### Task 15: Storage API for syllabus PDFs

**Files:**
- Create: `src/api/storage.ts`

- [ ] **Step 1: Write `src/api/storage.ts`**

```ts
import { supabase } from '../lib/supabase';

const BUCKET = 'syllabi';
const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes — fresh for each view

function pathFor(userId: string, courseId: string): string {
  return `${userId}/${courseId}.pdf`;
}

/** Upload (or replace) the syllabus PDF for a given course. Returns the storage path. */
export async function uploadSyllabus(courseId: string, file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const path = pathFor(user.id, courseId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: 'application/pdf',
  });
  if (error) throw error;
  return path;
}

/** Get a short-lived signed URL to view a syllabus. */
export async function getSyllabusUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

/** Delete a syllabus file. Safe to call when no file exists. */
export async function deleteSyllabus(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/storage.ts
git commit -m "feat(api): storage upload/signed-url/delete for syllabus PDFs"
```

---

## Phase 6 — Auth Layer

### Task 16: AuthProvider context

**Files:**
- Create: `src/auth/AuthProvider.tsx`

- [ ] **Step 1: Write `src/auth/AuthProvider.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  setNewPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const sendPasswordReset = async (email: string) => {
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}#/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  };

  const setNewPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ session, loading, signIn, signOut, sendPasswordReset, setNewPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/auth/AuthProvider.tsx
git commit -m "feat(auth): AuthProvider context with session, sign-in, reset"
```

---

### Task 17: LoginPage component

**Files:**
- Create: `src/auth/LoginPage.tsx`

- [ ] **Step 1: Write `src/auth/LoginPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { signIn, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'forgot'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await sendPasswordReset(email);
      setInfo('Check your email for a reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Education Log</h1>
        <hr className="login-rule" />

        {mode === 'sign-in' ? (
          <form onSubmit={onSignIn}>
            <label>
              email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            {error && <p className="login-error">{error}</p>}
            <p className="login-link">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('forgot');
                  setError(null);
                  setInfo(null);
                }}
              >
                forgot password?
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={onForgot}>
            <label>
              email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            {error && <p className="login-error">{error}</p>}
            {info && <p className="login-info">{info}</p>}
            <p className="login-link">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('sign-in');
                  setError(null);
                  setInfo(null);
                }}
              >
                back to sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/auth/LoginPage.tsx
git commit -m "feat(auth): LoginPage with sign-in and forgot-password forms"
```

---

### Task 18: ResetPasswordPage component

**Files:**
- Create: `src/auth/ResetPasswordPage.tsx`

- [ ] **Step 1: Write `src/auth/ResetPasswordPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Rendered after the user clicks the reset link in their email.
 * Supabase puts a recovery session on the URL hash; AuthProvider picks it up
 * via onAuthStateChange. The user then sets a new password here.
 */
export function ResetPasswordPage() {
  const { setNewPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await setNewPassword(password);
      window.location.hash = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Set new password</h1>
        <hr className="login-rule" />
        <form onSubmit={onSubmit}>
          <label>
            new password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save password'}
          </button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/auth/ResetPasswordPage.tsx
git commit -m "feat(auth): ResetPasswordPage for after email click"
```

---

### Task 19: App routing with auth gate

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginPage } from './auth/LoginPage';
import { ResetPasswordPage } from './auth/ResetPasswordPage';
import { HomePage } from './pages/HomePage';

function useHashRoute(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return hash;
}

function Router() {
  const { session, loading } = useAuth();
  const hash = useHashRoute();

  if (loading) return null;

  // Reset link from email lands at #/reset-password and Supabase places a
  // recovery session on the URL. Show the reset form even if we appear "signed in"
  // (the session at this moment is the recovery session, not a regular login).
  if (hash.startsWith('#/reset-password')) {
    return <ResetPasswordPage />;
  }

  return session ? <HomePage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors on missing `HomePage` (we create it next). That's fine for now.

- [ ] **Step 3: Create a placeholder `src/pages/HomePage.tsx` so the build compiles**

```tsx
import { useAuth } from '../auth/AuthProvider';

export function HomePage() {
  const { signOut } = useAuth();
  return (
    <div style={{ padding: 32 }}>
      <p>Logged in. (HomePage coming next.)</p>
      <button onClick={signOut}>Log out</button>
    </div>
  );
}
```

- [ ] **Step 4: Type-check again**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

Open http://localhost:5173. Expected:
- Unauthenticated → see "Education Log" login form.
- Submit valid credentials (the account from Task 7) → see "Logged in." placeholder.
- Click "Log out" → returned to login form.
- Click "forgot password?" → form switches to email-only; submitting sends a real email.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/pages/HomePage.tsx
git commit -m "feat: app router with auth gate and reset-password route"
```

---

## Phase 7 — Global Theme & Page Shell

### Task 20: Academic-minimal global CSS

**Files:**
- Replace: `src/index.css`

- [ ] **Step 1: Replace `src/index.css`**

```css
:root {
  --bg: #f7f3ec;
  --paper: #fbf8f1;
  --ink: #2a2a2a;
  --ink-soft: #5a5a5a;
  --ink-faint: #8a7a5a;
  --rule: #d8cdb6;
  --accent: #8a3a1f;
  --serif: Georgia, 'Times New Roman', 'Iowan Old Style', serif;
  --mono: 'SF Mono', Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }

html, body, #root {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--serif);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

button {
  font-family: inherit;
  font-size: 14px;
  background: var(--paper);
  color: var(--ink);
  border: 1px solid var(--rule);
  padding: 8px 16px;
  cursor: pointer;
}
button:hover:not(:disabled) { background: var(--bg); }
button:disabled { opacity: 0.5; cursor: not-allowed; }

input, select, textarea {
  font-family: inherit;
  font-size: 15px;
  background: var(--paper);
  color: var(--ink);
  border: 1px solid var(--rule);
  padding: 8px 10px;
  width: 100%;
}

label {
  display: block;
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
label input, label select, label textarea { margin-top: 4px; }

hr { border: 0; border-top: 1px solid var(--rule); margin: 24px 0; }

/* ─── Login ──────────────────────────────────────── */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.login-card {
  background: var(--paper);
  border: 1px solid var(--rule);
  padding: 40px 48px;
  max-width: 380px;
  width: 100%;
}
.login-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  text-align: center;
  letter-spacing: 0.5px;
}
.login-rule { margin: 20px 0 28px; }
.login-error { color: var(--accent); font-size: 13px; margin-top: 12px; }
.login-info { color: var(--ink-soft); font-size: 13px; margin-top: 12px; font-style: italic; }
.login-link { text-align: center; margin-top: 20px; font-size: 13px; }

/* ─── Page shell ──────────────────────────────────── */
.page {
  max-width: 880px;
  margin: 0 auto;
  padding: 48px 32px 96px;
}

/* ─── Header ──────────────────────────────────────── */
.header { margin-bottom: 48px; }
.header-name { font-size: 28px; font-weight: 600; margin: 0; }
.header-stats {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 6px 0 0;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.header-stats button { margin-left: auto; }

/* ─── Program section ─────────────────────────────── */
.program-section { margin-bottom: 56px; }
.program-section + .program-section { border-top: 1px solid var(--rule); padding-top: 32px; }

.program-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.program-abbr {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
}
.program-meta { font-size: 12px; color: var(--ink-faint); letter-spacing: 1px; }
.program-fullname { font-size: 18px; font-style: italic; color: var(--ink-soft); margin: 0; }
.program-institution { font-size: 13px; color: var(--ink-soft); }
.program-description { font-size: 14px; color: var(--ink-soft); margin-top: 6px; }
.program-edit {
  margin-left: auto;
  background: transparent;
  border: 0;
  color: var(--ink-faint);
  cursor: pointer;
  padding: 4px;
}
.program-edit:hover { color: var(--accent); }

.course-list { margin: 24px 0 0; padding: 0; list-style: none; }

/* ─── Course row ──────────────────────────────────── */
.course-row {
  display: grid;
  grid-template-columns: 110px 1fr auto auto;
  gap: 12px 16px;
  padding: 10px 0;
  border-bottom: 1px dotted var(--rule);
  cursor: pointer;
  align-items: baseline;
}
.course-row.planned { color: var(--ink-faint); }
.course-row.planned .course-grade { font-style: italic; }
.course-row.in-progress .course-grade { font-style: italic; color: var(--ink-soft); }
.course-code { font-family: var(--mono); font-size: 13px; color: var(--ink-soft); }
.course-name { font-size: 15px; }
.course-instructor { font-size: 13px; font-style: italic; color: var(--ink-soft); margin-left: 8px; }
.course-term { font-size: 12px; color: var(--ink-faint); letter-spacing: 0.5px; text-align: right; }
.course-grade {
  font-size: 15px;
  font-weight: 600;
  text-align: right;
  min-width: 90px;
}
.course-grade .small { font-size: 12px; font-weight: 400; color: var(--ink-soft); margin-left: 6px; }
.course-icons { display: inline-flex; gap: 6px; margin-left: 8px; }
.course-icons a { color: var(--ink-faint); }
.course-icons a:hover { color: var(--accent); }
.course-edit {
  background: transparent; border: 0; color: var(--ink-faint); cursor: pointer; padding: 0 4px;
}
.course-edit:hover { color: var(--accent); }

.course-detail {
  padding: 12px 0 16px 110px;
  font-size: 13px;
  color: var(--ink-soft);
  border-bottom: 1px dotted var(--rule);
}
.course-detail p { margin: 4px 0; }

/* ─── Footer ──────────────────────────────────────── */
.footer {
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid var(--rule);
  font-size: 12px;
  color: var(--ink-faint);
  display: flex;
  justify-content: space-between;
}

/* ─── Modal ───────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(40, 30, 20, 0.4);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 48px 16px;
  z-index: 100;
  overflow-y: auto;
}
.modal {
  background: var(--paper);
  border: 1px solid var(--rule);
  padding: 32px 36px;
  max-width: 560px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.modal h2 { margin: 0 0 20px; font-size: 22px; font-weight: 600; }
.modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.modal-actions { display: flex; gap: 12px; margin-top: 28px; align-items: center; }
.modal-actions .spacer { flex: 1; }
.modal-actions .danger {
  background: transparent; border: 0; color: var(--accent); cursor: pointer; font-size: 13px;
}

/* ─── Empty states ────────────────────────────────── */
.empty {
  text-align: center;
  padding: 80px 0;
  color: var(--ink-faint);
}
.empty p { margin: 0 0 16px; font-style: italic; }

/* ─── Mobile ──────────────────────────────────────── */
@media (max-width: 640px) {
  .page { padding: 24px 16px 64px; }
  .course-row {
    grid-template-columns: 1fr auto;
    gap: 4px 12px;
  }
  .course-instructor { margin-left: 0; display: block; }
  .course-term { grid-column: 1 / -1; text-align: left; }
  .course-detail { padding-left: 0; }
}
```

- [ ] **Step 2: Manual verification**

```bash
npm run dev
```

Open http://localhost:5173. Login screen now uses the cream + serif theme. Sign in: the placeholder HomePage still shows but will inherit the global font/colors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): academic-minimal global theme"
```

---

### Task 21: Reusable Modal component

**Files:**
- Create: `src/components/Modal.tsx`

- [ ] **Step 1: Write `src/components/Modal.tsx`**

```tsx
import { useEffect, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Modal.tsx
git commit -m "feat(ui): generic Modal wrapper"
```

---

### Task 22: Inline icons component

**Files:**
- Create: `src/components/icons.tsx`

- [ ] **Step 1: Write `src/components/icons.tsx`**

```tsx
export function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="syllabus PDF">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub repo">
      <path d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.3.8 1 .8 2v3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.6 18.4.5 12 .5z" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="edit">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="add">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/icons.tsx
git commit -m "feat(ui): inline SVG icons (pdf, github, edit, plus)"
```

---

## Phase 8 — Program UI

### Task 23: GradingScaleEditor component

**Files:**
- Create: `src/components/GradingScaleEditor.tsx`

- [ ] **Step 1: Write `src/components/GradingScaleEditor.tsx`**

```tsx
import type { GradingScale } from '../types';
import { GRADING_SCALE_PRESETS } from '../lib/grading-scales';

interface Props {
  value: GradingScale;
  onChange: (next: GradingScale) => void;
}

export function GradingScaleEditor({ value, onChange }: Props) {
  const applyPreset = (presetId: string) => {
    const preset = GRADING_SCALE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange(preset.scale.map((row) => ({ ...row })));
  };

  const updateRow = (i: number, patch: Partial<{ letter: string; gpa: number | null }>) => {
    const next = value.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => onChange([...value, { letter: '', gpa: 0 }]);
  const removeRow = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <label>
        start from template
        <select onChange={(e) => applyPreset(e.target.value)} defaultValue="">
          <option value="" disabled>
            choose a template…
          </option>
          {GRADING_SCALE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 1.5, paddingBottom: 6 }}>
              letter
            </th>
            <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 1.5, paddingBottom: 6 }}>
              gpa (blank = excluded)
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {value.map((row, i) => (
            <tr key={i}>
              <td style={{ paddingRight: 8, paddingBottom: 4 }}>
                <input
                  type="text"
                  value={row.letter}
                  onChange={(e) => updateRow(i, { letter: e.target.value })}
                  required
                />
              </td>
              <td style={{ paddingRight: 8, paddingBottom: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  value={row.gpa ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateRow(i, { gpa: v === '' ? null : Number(v) });
                  }}
                />
              </td>
              <td style={{ paddingBottom: 4 }}>
                <button type="button" onClick={() => removeRow(i)} style={{ padding: '4px 10px' }}>
                  remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} style={{ marginTop: 12 }}>
        + add row
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/GradingScaleEditor.tsx
git commit -m "feat(ui): GradingScaleEditor with preset templates and row editor"
```

---

### Task 24: ProgramFormModal

**Files:**
- Create: `src/components/ProgramFormModal.tsx`

- [ ] **Step 1: Write `src/components/ProgramFormModal.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { GradingScaleEditor } from './GradingScaleEditor';
import type { Program, ProgramInput, ProgramKind, LifecycleStatus, GradingScale } from '../types';

interface Props {
  initial?: Program | null;
  onSubmit: (input: ProgramInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const blank = (): ProgramInput => ({
  abbreviation: '',
  full_name: '',
  institution: '',
  kind: 'degree',
  start_date: '',
  end_date: null,
  status: 'planned',
  description: null,
  grading_scale: [],
  display_order: 0,
});

export function ProgramFormModal({ initial, onSubmit, onDelete, onClose }: Props) {
  const [form, setForm] = useState<ProgramInput>(() => {
    if (!initial) return blank();
    const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...rest } = initial;
    return rest;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProgramInput>(key: K, val: ProgramInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    if (!window.confirm('Delete this program AND all its courses? This cannot be undone.')) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit program' : 'Add program'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-row">
          <label>
            abbreviation *
            <input value={form.abbreviation} onChange={(e) => set('abbreviation', e.target.value)} required />
          </label>
          <label>
            kind *
            <select value={form.kind} onChange={(e) => set('kind', e.target.value as ProgramKind)}>
              <option value="degree">Degree</option>
              <option value="certificate">Certificate</option>
            </select>
          </label>
        </div>

        <label>
          full name *
          <input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
        </label>
        <label>
          institution *
          <input value={form.institution} onChange={(e) => set('institution', e.target.value)} required />
        </label>

        <div className="modal-row">
          <label>
            start date *
            <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} required />
          </label>
          <label>
            end date
            <input
              type="date"
              value={form.end_date ?? ''}
              onChange={(e) => set('end_date', e.target.value || null)}
            />
          </label>
        </div>

        <label>
          status *
          <select value={form.status} onChange={(e) => set('status', e.target.value as LifecycleStatus)}>
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label>
          description
          <textarea
            rows={2}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
          />
        </label>

        <hr />
        <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--ink-faint)' }}>
          grading scale
        </h3>
        <GradingScaleEditor
          value={form.grading_scale}
          onChange={(next: GradingScale) => set('grading_scale', next)}
        />

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          {initial && onDelete && (
            <button type="button" className="danger" onClick={remove} disabled={busy}>
              Delete program
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProgramFormModal.tsx
git commit -m "feat(ui): ProgramFormModal for add/edit/delete"
```

---

### Task 25: ProgramHeader component

**Files:**
- Create: `src/components/ProgramHeader.tsx`

- [ ] **Step 1: Write `src/components/ProgramHeader.tsx`**

```tsx
import type { Program } from '../types';
import { EditIcon } from './icons';

interface Props {
  program: Program;
  gpa: number | null;
  onEdit: () => void;
}

function formatDates(p: Program): string {
  const startYear = new Date(p.start_date).getFullYear();
  if (p.status === 'planned') return 'planned';
  if (p.status === 'in_progress') return `${startYear} – present`;
  if (!p.end_date) return `${startYear}`;
  const endYear = new Date(p.end_date).getFullYear();
  return startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;
}

export function ProgramHeader({ program, gpa, onEdit }: Props) {
  const kindLabel = program.kind === 'degree' ? 'Degree' : 'Certificate';
  const dates = formatDates(program);
  const gpaStr = gpa !== null ? `GPA ${gpa.toFixed(2)}` : null;

  return (
    <div>
      <div className="program-header">
        <span className="program-abbr">{program.abbreviation}</span>
        <span className="program-meta">
          {kindLabel} · {dates}
          {gpaStr && ` · ${gpaStr}`}
        </span>
        <button className="program-edit" onClick={onEdit} aria-label="edit program">
          <EditIcon />
        </button>
      </div>
      <p className="program-fullname">{program.full_name}</p>
      <div className="program-institution">{program.institution}</div>
      {program.description && <p className="program-description">{program.description}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProgramHeader.tsx
git commit -m "feat(ui): ProgramHeader with abbreviation, badge, dates, GPA"
```

---

## Phase 9 — Course UI

### Task 26: CourseFormModal

**Files:**
- Create: `src/components/CourseFormModal.tsx`

- [ ] **Step 1: Write `src/components/CourseFormModal.tsx`**

```tsx
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Modal } from './Modal';
import { uploadSyllabus, deleteSyllabus } from '../api/storage';
import type {
  Course, CourseInput, CourseType, LifecycleStatus, Program, TermSeason,
} from '../types';

interface Props {
  program: Program;
  initial?: Course | null;
  onSubmit: (input: CourseInput, pdf: File | null, removePdf: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const SEASONS: TermSeason[] = ['autumn', 'winter', 'spring', 'summer'];

const blank = (programId: string): CourseInput => ({
  program_id: programId,
  code: '',
  name: '',
  term_year: new Date().getFullYear(),
  term_season: 'autumn',
  status: 'planned',
  type: 'credit',
  instructor: null,
  credits: null,
  grade: null,
  syllabus_path: null,
  github_url: null,
  note: null,
});

export function CourseFormModal({ program, initial, onSubmit, onDelete, onClose }: Props) {
  const [form, setForm] = useState<CourseInput>(() => {
    if (!initial) return blank(program.id);
    const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...rest } = initial;
    return rest;
  });
  const [pdf, setPdf] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CourseInput>(key: K, val: CourseInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const gradeable = form.type === 'credit' && form.status === 'completed';
  const gradeOptions = program.grading_scale.map((g) => g.letter);

  const onPdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setPdf(f);
    setRemovePdf(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form, pdf, removePdf);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    if (!window.confirm('Delete this course?')) return;
    setBusy(true);
    try {
      if (initial?.syllabus_path) {
        await deleteSyllabus(initial.syllabus_path).catch(() => undefined);
      }
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit course' : 'Add course'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-row">
          <label>
            code *
            <input value={form.code} onChange={(e) => set('code', e.target.value)} required />
          </label>
          <label>
            credits
            <input
              type="number"
              step="0.5"
              value={form.credits ?? ''}
              onChange={(e) => set('credits', e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
        </div>

        <label>
          name *
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>

        <div className="modal-row">
          <label>
            year *
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.term_year}
              onChange={(e) => set('term_year', Number(e.target.value))}
              required
            />
          </label>
          <label>
            season *
            <select value={form.term_season} onChange={(e) => set('term_season', e.target.value as TermSeason)}>
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-row">
          <label>
            status *
            <select value={form.status} onChange={(e) => set('status', e.target.value as LifecycleStatus)}>
              <option value="planned">Planned</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            type *
            <select value={form.type} onChange={(e) => set('type', e.target.value as CourseType)}>
              <option value="credit">Credit</option>
              <option value="audit">Audit</option>
              <option value="self_study">Self-study</option>
            </select>
          </label>
        </div>

        <div className="modal-row">
          <label>
            instructor
            <input
              value={form.instructor ?? ''}
              onChange={(e) => set('instructor', e.target.value || null)}
            />
          </label>
          <label>
            grade {gradeable ? '' : '(N/A)'}
            <select
              value={form.grade ?? ''}
              onChange={(e) => set('grade', e.target.value || null)}
              disabled={!gradeable}
            >
              <option value="">—</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          github URL
          <input
            type="url"
            value={form.github_url ?? ''}
            onChange={(e) => set('github_url', e.target.value || null)}
          />
        </label>

        <label>
          note (one line)
          <input
            value={form.note ?? ''}
            onChange={(e) => set('note', e.target.value || null)}
          />
        </label>

        <label>
          syllabus PDF
          <input type="file" accept="application/pdf" onChange={onPdfChange} />
          {form.syllabus_path && !pdf && !removePdf && (
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              Current PDF on file.{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setRemovePdf(true);
                }}
              >
                remove
              </a>
            </span>
          )}
          {removePdf && (
            <span style={{ fontSize: 12, color: 'var(--accent)' }}>Will be removed on save.</span>
          )}
        </label>

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          {initial && onDelete && (
            <button type="button" className="danger" onClick={remove} disabled={busy}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

Note: the `pdf` and `removePdf` flags are passed to `onSubmit`. The page-level handler (Task 28) is responsible for: (a) creating/updating the course row first to obtain its `id`, (b) uploading the PDF if present and patching `syllabus_path`, (c) deleting the existing syllabus if `removePdf` is set.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CourseFormModal.tsx
git commit -m "feat(ui): CourseFormModal with conditional grade dropdown and PDF upload"
```

---

### Task 27: CourseRow with inline expand

**Files:**
- Create: `src/components/CourseRow.tsx`

- [ ] **Step 1: Write `src/components/CourseRow.tsx`**

```tsx
import { useState, useEffect } from 'react';
import type { Course } from '../types';
import { PdfIcon, GitHubIcon, EditIcon } from './icons';
import { getSyllabusUrl } from '../api/storage';

interface Props {
  course: Course;
  onEdit: () => void;
}

const seasonLabel: Record<string, string> = {
  autumn: 'Autumn',
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
};

const typeBadge: Record<string, string | null> = {
  credit: null,
  audit: 'audit',
  self_study: 'self-study',
};

export function CourseRow({ course, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [syllabusUrl, setSyllabusUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!course.syllabus_path) {
      setSyllabusUrl(null);
      return;
    }
    let cancelled = false;
    getSyllabusUrl(course.syllabus_path)
      .then((u) => { if (!cancelled) setSyllabusUrl(u); })
      .catch(() => { if (!cancelled) setSyllabusUrl(null); });
    return () => { cancelled = true; };
  }, [course.syllabus_path]);

  const term = `${seasonLabel[course.term_season]} ${course.term_year}`;
  const badge = typeBadge[course.type];

  const gradeCell =
    course.status === 'planned' ? <span>planned</span>
    : course.status === 'in_progress' ? <span>in progress</span>
    : course.grade
      ? <>
          <span>{course.grade}</span>
          {course.credits != null && <span className="small">{course.credits} cr</span>}
        </>
      : <span>—</span>;

  return (
    <>
      <li
        className={`course-row ${course.status === 'planned' ? 'planned' : ''} ${course.status === 'in_progress' ? 'in-progress' : ''}`}
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="course-code">{course.code}</div>
        <div>
          <span className="course-name">{course.name}</span>
          {course.instructor && <span className="course-instructor">{course.instructor}</span>}
          {badge && <span className="course-instructor"> · {badge}</span>}
        </div>
        <div className="course-term">{term}</div>
        <div className="course-grade">
          {gradeCell}
          <span className="course-icons" onClick={(e) => e.stopPropagation()}>
            {syllabusUrl && (
              <a href={syllabusUrl} target="_blank" rel="noreferrer">
                <PdfIcon />
              </a>
            )}
            {course.github_url && (
              <a href={course.github_url} target="_blank" rel="noreferrer">
                <GitHubIcon />
              </a>
            )}
            <button
              className="course-edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="edit course"
            >
              <EditIcon />
            </button>
          </span>
        </div>
      </li>
      {expanded && (course.note || syllabusUrl || course.github_url) && (
        <li className="course-detail">
          {course.note && <p>{course.note}</p>}
          {syllabusUrl && (
            <p>
              <a href={syllabusUrl} target="_blank" rel="noreferrer">
                Open syllabus PDF
              </a>
            </p>
          )}
          {course.github_url && (
            <p>
              <a href={course.github_url} target="_blank" rel="noreferrer">
                {course.github_url}
              </a>
            </p>
          )}
        </li>
      )}
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CourseRow.tsx
git commit -m "feat(ui): CourseRow transcript-style with inline expand and icons"
```

---

### Task 28: ProgramSection wiring everything together

**Files:**
- Create: `src/components/ProgramSection.tsx`

- [ ] **Step 1: Write `src/components/ProgramSection.tsx`**

```tsx
import { useState } from 'react';
import type { Course, Program, CourseInput } from '../types';
import { ProgramHeader } from './ProgramHeader';
import { CourseRow } from './CourseRow';
import { ProgramFormModal } from './ProgramFormModal';
import { CourseFormModal } from './CourseFormModal';
import { computeGpa } from '../lib/gpa';
import { createCourse, updateCourse, deleteCourse } from '../api/courses';
import { updateProgram, deleteProgram } from '../api/programs';
import { uploadSyllabus, deleteSyllabus } from '../api/storage';
import { PlusIcon } from './icons';

interface Props {
  program: Program;
  courses: Course[];
  reload: () => Promise<void>;
}

const seasonOrder = { autumn: 0, winter: 1, spring: 2, summer: 3 } as const;

export function ProgramSection({ program, courses, reload }: Props) {
  const [editingProgram, setEditingProgram] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const sortedCourses = [...courses].sort((a, b) => {
    if (a.term_year !== b.term_year) return a.term_year - b.term_year;
    return seasonOrder[a.term_season] - seasonOrder[b.term_season];
  });

  const gpa = computeGpa(courses, program.grading_scale);

  const onSubmitCourse = async (input: CourseInput, pdf: File | null, removePdf: boolean) => {
    if (editingCourse) {
      let patch: Partial<CourseInput> = { ...input };
      if (removePdf && editingCourse.syllabus_path) {
        await deleteSyllabus(editingCourse.syllabus_path).catch(() => undefined);
        patch.syllabus_path = null;
      }
      const updated = await updateCourse(editingCourse.id, patch);
      if (pdf) {
        const path = await uploadSyllabus(updated.id, pdf);
        await updateCourse(updated.id, { syllabus_path: path });
      }
    } else {
      const created = await createCourse(input);
      if (pdf) {
        const path = await uploadSyllabus(created.id, pdf);
        await updateCourse(created.id, { syllabus_path: path });
      }
    }
    await reload();
  };

  return (
    <section className="program-section">
      <ProgramHeader program={program} gpa={gpa} onEdit={() => setEditingProgram(true)} />

      {sortedCourses.length === 0 ? (
        <p style={{ marginTop: 16, fontStyle: 'italic', color: 'var(--ink-faint)' }}>
          No courses added yet.
        </p>
      ) : (
        <ul className="course-list">
          {sortedCourses.map((c) => (
            <CourseRow key={c.id} course={c} onEdit={() => setEditingCourse(c)} />
          ))}
        </ul>
      )}

      <button onClick={() => setAddingCourse(true)} style={{ marginTop: 16 }}>
        <PlusIcon /> Add course
      </button>

      {editingProgram && (
        <ProgramFormModal
          initial={program}
          onSubmit={async (input) => {
            await updateProgram(program.id, input);
            await reload();
          }}
          onDelete={async () => {
            await deleteProgram(program.id);
            await reload();
          }}
          onClose={() => setEditingProgram(false)}
        />
      )}

      {addingCourse && (
        <CourseFormModal
          program={program}
          onSubmit={onSubmitCourse}
          onClose={() => setAddingCourse(false)}
        />
      )}

      {editingCourse && (
        <CourseFormModal
          program={program}
          initial={editingCourse}
          onSubmit={onSubmitCourse}
          onDelete={async () => {
            await deleteCourse(editingCourse.id);
            await reload();
          }}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProgramSection.tsx
git commit -m "feat(ui): ProgramSection wires programs + courses + modals + GPA"
```

---

### Task 29: Header, Footer, and HomePage assembly

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`
- Replace: `src/pages/HomePage.tsx`

- [ ] **Step 1: Write `src/components/Header.tsx`**

```tsx
import type { Course, Program } from '../types';
import { PlusIcon } from './icons';

interface Props {
  programs: Program[];
  courses: Course[];
  onAddProgram: () => void;
}

export function Header({ programs, courses, onAddProgram }: Props) {
  const inProgress = courses.filter((c) => c.status === 'in_progress').length;
  const planned = courses.filter((c) => c.status === 'planned').length;

  return (
    <header className="header">
      <h1 className="header-name">Education Log</h1>
      <div className="header-stats">
        <span>{programs.length} programs</span>
        <span>·</span>
        <span>{courses.length} courses</span>
        {inProgress > 0 && <><span>·</span><span>{inProgress} in progress</span></>}
        {planned > 0 && <><span>·</span><span>{planned} planned</span></>}
        <button onClick={onAddProgram}>
          <PlusIcon /> Add program
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Write `src/components/Footer.tsx`**

```tsx
import { useAuth } from '../auth/AuthProvider';
import type { Course, Program } from '../types';

interface Props {
  programs: Program[];
  courses: Course[];
}

function maxUpdatedAt(programs: Program[], courses: Course[]): string | null {
  const all = [...programs.map((p) => p.updated_at), ...courses.map((c) => c.updated_at)];
  if (all.length === 0) return null;
  return all.sort().at(-1) ?? null;
}

export function Footer({ programs, courses }: Props) {
  const { signOut } = useAuth();
  const last = maxUpdatedAt(programs, courses);
  const lastDate = last ? new Date(last).toISOString().slice(0, 10) : '—';
  return (
    <footer className="footer">
      <span>Last updated {lastDate}</span>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          void signOut();
        }}
      >
        Log out
      </a>
    </footer>
  );
}
```

- [ ] **Step 3: Replace `src/pages/HomePage.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import type { Course, Program } from '../types';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProgramSection } from '../components/ProgramSection';
import { ProgramFormModal } from '../components/ProgramFormModal';
import { listPrograms, createProgram } from '../api/programs';
import { listCourses } from '../api/courses';

export function HomePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [ps, cs] = await Promise.all([listPrograms(), listCourses()]);
      setPrograms(ps);
      setCourses(cs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, [reload]);

  if (loading) return null;

  return (
    <div className="page">
      <Header programs={programs} courses={courses} onAddProgram={() => setAdding(true)} />

      {error && <p className="login-error">{error}</p>}

      {programs.length === 0 ? (
        <div className="empty">
          <p>Add your first program to get started.</p>
          <button onClick={() => setAdding(true)}>+ Add program</button>
        </div>
      ) : (
        programs.map((p) => (
          <ProgramSection
            key={p.id}
            program={p}
            courses={courses.filter((c) => c.program_id === p.id)}
            reload={reload}
          />
        ))
      )}

      <Footer programs={programs} courses={courses} />

      {adding && (
        <ProgramFormModal
          onSubmit={async (input) => {
            await createProgram(input);
            await reload();
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual verification end-to-end**

```bash
npm run dev
```

In the browser:
1. Sign in. See the empty state.
2. Click "+ Add program". Fill in (e.g., abbreviation "UChicago MSFM", full name "Master of Science in Financial Mathematics", institution "University of Chicago", kind Degree, start_date 2022-09-01, status In progress, pick US Standard 4.0 preset, save).
3. Section appears. Click "+ Add course". Fill (code "FinM 34500", name "Stochastic Calculus", year 2023, season autumn, status completed, type credit, instructor "Roger Lee", credits 100, grade A, save).
4. Course row appears, GPA shows 4.00 in the program header.
5. Click the course row → expand. (Note empty so detail won't show; add a note via edit.)
6. Edit the course → add a note "favorite class". Save → row expand shows the note.
7. Upload a PDF → save → 📄 icon appears next to grade. Click → opens PDF in new tab.
8. Add a planned course (status planned). Verify lighter color and "planned" tag.
9. Delete a course via edit modal. Confirm gone.
10. Delete the program → all its courses disappear too.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx src/components/Footer.tsx src/pages/HomePage.tsx
git commit -m "feat(ui): Header, Footer, HomePage end-to-end wiring"
```

---

## Phase 10 — Repo, Deployment, Polish

### Task 30: Push to GitHub

**Files:** none

- [ ] **Step 1: Create the GitHub repo and push**

```bash
gh repo create dafu-zhu/education-log --public --source . --remote origin --push --description "Personal post-bachelor education tracker"
```

Expected: repo created at https://github.com/dafu-zhu/education-log, current branch pushed.

- [ ] **Step 2: Add the GitHub Pages URL to Supabase CORS**

In Supabase dashboard → Settings → API → "Additional allowed origins", confirm `https://dafu-zhu.github.io` is in the list (added in Task 7, Step 3).

- [ ] **Step 3: Add the build-time secrets**

```bash
gh secret set VITE_SUPABASE_URL --body "https://YOUR-PROJECT-REF.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "YOUR-ANON-KEY"
```

(Use the values captured in Task 5, Step 3.)

---

### Task 31: GitHub Action — build & deploy to Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow file**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Pages with the GitHub Actions source**

```bash
gh api -X POST /repos/dafu-zhu/education-log/pages -f build_type=workflow
```

(If the call returns "Pages already exists" you can ignore.)

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages deploy workflow"
git push origin main
```

- [ ] **Step 4: Verify the deploy ran**

```bash
gh run watch
```

Expected: build job runs `npm test` (9 GPA tests pass), then `npm run build`, then deploy job publishes Pages. Open the printed Pages URL — should show the login screen.

- [ ] **Step 5: End-to-end on the deployed site**

Open `https://dafu-zhu.github.io/education-log/` in the browser. Log in. Verify your local data is there (it lives in Supabase, not in the bundle). Add a course from this URL to confirm RLS allows it.

---

### Task 32: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# education-log

A private, single-user personal dashboard for tracking post-bachelor
education across multiple programs (degrees + certificates) — courses,
syllabi PDFs, GitHub project links, per-program GPA.

Live: https://dafu-zhu.github.io/education-log/

Stack: Vite + React + TypeScript on GitHub Pages, Supabase
(Auth + Postgres + Storage) backend.

## Local development

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL
   and anon key (Supabase dashboard → Settings → API).
3. Apply migrations under `supabase/migrations/` to a Supabase project
   (paste each SQL file into the dashboard SQL editor and run in order).
   See `supabase/README.md`.
4. Create your user account via the Supabase dashboard
   (Authentication → Users → Add user) and **disable signups**
   (Authentication → Providers → Email → Enable email signup = off).
5. `npm run dev` → http://localhost:5173

## Tests

```bash
npm test            # one-shot
npm run test:watch  # watch mode
```

Only the GPA computation has unit tests; everything else is verified
by clicking through the UI.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` which builds
the site and publishes it to GitHub Pages. Build-time env vars come
from repo secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: README with setup, test, and deploy instructions"
git push origin main
```

---

## Self-Review

### Spec coverage check

Walking through each section of the spec:

| Spec section | Implementing tasks |
|---|---|
| §1 Purpose & Scope | covered by overall plan |
| §2 Architecture (Vite/React/Supabase/GH Pages) | Tasks 1, 9, 31 |
| §3 Data Model — `program` table | Task 6 (schema), Task 8 (types) |
| §3 Data Model — `course` table | Task 6, Task 8 |
| §3 grading_scale JSON shape | Task 8, Task 12 |
| §3 Storage bucket + path convention | Task 6 (storage migration), Task 15 |
| §3 RLS policies | Task 6 (rls migration) |
| §3 Computed values: per-program GPA | Tasks 10, 11 (TDD) |
| §3 Computed values: header stats | Task 29 (Header) |
| §4 Login screen | Task 17 |
| §4 Header strip | Task 29 |
| §4 Program section + course rendering | Tasks 25, 27, 28, 29 |
| §4 Visual states (completed/in-progress/planned) | Task 20 (CSS), Task 27 |
| §4 Click course → expand inline | Task 27 |
| §4 Edit affordances | Task 25, Task 27 |
| §4 Footer (last updated, log out) | Task 29 (Footer.tsx) |
| §4 Empty states | Task 28 (no courses), Task 29 (no programs) |
| §4 Mobile responsive | Task 20 (CSS @media) |
| §5 Add/edit program modal | Task 24 |
| §5 Grading scale editor with presets | Tasks 12, 23 |
| §5 Add/edit course modal | Task 26 |
| §5 Grade dropdown driven by program scale | Task 26 |
| §5 PDF upload | Tasks 15, 26, 28 |
| §5 Validation | enforced via HTML required + select + number; Task 24, Task 26 |
| §6 Email/password auth | Tasks 16, 17 |
| §6 Password reset flow | Tasks 16, 17, 18, 19 |
| §6 Single-user lockdown (signup disabled) | Task 7 (manual) |
| §6 RLS, signed URLs, CORS, HTTPS | Tasks 6, 7, 15 |
| §7 Repo + deploy + Pages | Tasks 30, 31, 32 |
| §7 Build-time env vars as secrets | Task 30 |
| §8 GPA unit tests + TypeScript + ESLint/Prettier | Tasks 2, 3, 10, 11 |
| §9 Out-of-scope items | not implemented (correct) |
| §10 Open questions | left for implementation/operator |

No gaps.

### Placeholder scan

Searched the plan for the disallowed patterns ("TBD", "TODO", "implement later", "fill in details", "appropriate error handling", "similar to Task N"). None found. The only "fill in" instructions are for human secrets (Supabase URL, anon key) which is correct.

### Type/symbol consistency

- `computeGpa(courses, scale)` — same signature in Tasks 10, 11, 28.
- `Program`, `Course`, `ProgramInput`, `CourseInput`, `GradingScale` — consistent across all consumers.
- `uploadSyllabus(courseId, file)` returns `string` (path); used the same way in Tasks 15, 26, 28.
- `getSyllabusUrl(path)`, `deleteSyllabus(path)` — consistent.
- `useAuth()` returns `{ session, loading, signIn, signOut, sendPasswordReset, setNewPassword }` — consumers (LoginPage, ResetPasswordPage, Footer) use only members defined here.
- API functions `listPrograms / createProgram / updateProgram / deleteProgram` and `listCourses / createCourse / updateCourse / deleteCourse` — consistent.
- CSS class names (`page`, `header`, `program-section`, `course-row`, `course-grade`, etc.) defined in Task 20 and used in Tasks 25, 27, 28, 29.
- Hash route `#/reset-password` set in `sendPasswordReset` (Task 16) and matched in `Router` (Task 19).

No mismatches.
