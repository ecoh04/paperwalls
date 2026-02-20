-- Create storage bucket for print files (run in Supabase Dashboard → SQL Editor if needed).
-- Or create via Dashboard: Storage → New bucket → name: print-files → Public bucket.

insert into storage.buckets (id, name, public)
values ('print-files', 'print-files', true)
on conflict (id) do update set public = true;

-- Allow anyone to upload (used by checkout API). Tighten in production if needed.
create policy "Allow anon upload to print-files"
on storage.objects for insert to anon
with bucket (bucket_id = 'print-files');

create policy "Allow public read print-files"
on storage.objects for select to public
using (bucket_id = 'print-files');
