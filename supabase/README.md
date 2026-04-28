# Supabase Migrations

These SQL files define the schema, RLS policies, and storage bucket
for the education-log project.

## Applying migrations

The simplest way (no Supabase CLI required) is to paste each file into
the Supabase dashboard SQL Editor and run them in order:

1. Go to your project → SQL Editor → New query.
2. Open `migrations/20260428000001_schema.sql`, paste, click "Run".
3. Repeat for `20260428000002_rls.sql` and `20260428000003_storage.sql`.

Always run them in numeric order. They will error if a type or table
already exists, so on a fresh project run each exactly once.
