-- Municipality branding: an optional logo stored in a public bucket.
alter table public.municipalities add column logo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('municipality-logos', 'municipality-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Objects live under "<municipality id>/"; only that municipality's admins may write them.
create policy "Municipality admins upload logos" on storage.objects for insert to authenticated
  with check (bucket_id = 'municipality-logos' and public.is_municipality_admin(((storage.foldername(name))[1])::uuid));
create policy "Municipality admins delete logos" on storage.objects for delete to authenticated
  using (bucket_id = 'municipality-logos' and public.is_municipality_admin(((storage.foldername(name))[1])::uuid));
