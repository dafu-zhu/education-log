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
