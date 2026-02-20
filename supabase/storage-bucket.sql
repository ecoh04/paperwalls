-- Create storage bucket for print files (run in Supabase Dashboard → SQL Editor if needed).
-- Or create via Dashboard: Storage → New bucket → name: print-files → Public bucket.

insert into storage.buckets (id, name, public)
values ('print-files', 'print-files', true)
on conflict (id) do update set public = true;

-- Allow anon (your app) to upload to print-files. Run in SQL Editor.
drop policy if exists "Allow anon upload to print-files" on storage.objects;
create policy "Allow anon upload to print-files"
on storage.objects for insert to anon
with check (bucket_id = 'print-files');

-- Allow public read so we can use public URLs for the images.
drop policy if exists "Allow public read print-files" on storage.objects;
create policy "Allow public read print-files"
on storage.objects for select to public
using (bucket_id = 'print-files');
