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
