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
