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
