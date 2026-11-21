-- Moderation: hidden reports and comments, user flags, and the "official channel" marker.

alter table public.reports add column is_hidden boolean not null default false;
alter table public.report_comments add column is_hidden boolean not null default false;
-- False until the municipality itself runs this deployment; the UI then drops the "independent initiative" notice.
alter table public.municipalities add column is_official boolean not null default false;

-- Hidden content stays visible to its author and to municipality staff.
drop policy "Reports are public" on public.reports;
create policy "Visible reports are public" on public.reports for select
  using (not is_hidden or author_id = (select auth.uid()) or public.is_municipality_staff(municipality_id));

-- Comments and events follow their report: the subquery only finds reports the caller may see.
drop policy "Comments are public" on public.report_comments;
create policy "Visible comments are public" on public.report_comments for select
  using (
    exists (select 1 from public.reports r where r.id = report_id)
    and (
      not is_hidden
      or author_id = (select auth.uid())
      or public.is_municipality_staff((select municipality_id from public.reports where id = report_id))
    )
  );

drop policy "Events are public" on public.report_events;
create policy "Events of visible reports are public" on public.report_events for select
  using (exists (select 1 from public.reports r where r.id = report_id));

-- Forward links stop working while a report is hidden.
create or replace function public.get_forwarded_report(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'forward', jsonb_build_object('message', f.message, 'created_at', f.created_at, 'expires_at', f.expires_at),
    'report', to_jsonb(r) - 'location',
    'municipality', jsonb_build_object('name', m.name, 'slug', m.slug, 'primary_color', m.primary_color),
    'category', jsonb_build_object('name', c.name, 'color', c.color),
    'status', jsonb_build_object('name', s.name, 'color', s.color)
  )
    from public.report_forwards f
    join public.reports r on r.id = f.report_id
    join public.municipalities m on m.id = r.municipality_id
    join public.categories c on c.id = r.category_id
    join public.statuses s on s.id = r.status_id
   where f.token = p_token and f.expires_at > now() and not r.is_hidden;
$$;

create function public.set_comment_hidden(p_comment_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.report_comments c
     set is_hidden = p_hidden
   where c.id = p_comment_id
     and public.is_municipality_staff((select r.municipality_id from public.reports r where r.id = c.report_id));
  if not found then
    raise exception 'Not allowed';
  end if;
end;
$$;

revoke execute on function public.set_comment_hidden(uuid, boolean) from public, anon;
grant execute on function public.set_comment_hidden(uuid, boolean) to authenticated;

create function public.protect_municipality_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_official is distinct from old.is_official
     and (select auth.uid()) is not null
     and not public.is_platform_admin() then
    raise exception 'Not allowed to change is_official';
  end if;
  return new;
end;
$$;

create trigger protect_municipality_columns
  before update on public.municipalities
  for each row execute function public.protect_municipality_columns();

-- Flags raised by signed-in users on a report, or on one of its comments.
create table public.content_flags (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  comment_id uuid references public.report_comments (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

create unique index content_flags_once_idx
  on public.content_flags (reporter_id, report_id, coalesce(comment_id, '00000000-0000-0000-0000-000000000000'));
create index content_flags_report_idx on public.content_flags (report_id);
create index content_flags_comment_idx on public.content_flags (comment_id);

alter table public.content_flags enable row level security;

create policy "Users flag content" on public.content_flags for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (comment_id is null or exists (
      select 1 from public.report_comments c where c.id = comment_id and c.report_id = content_flags.report_id
    ))
  );
create policy "Staff see flags" on public.content_flags for select to authenticated
  using (public.is_municipality_staff((select municipality_id from public.reports where id = report_id)));
create policy "Staff resolve flags" on public.content_flags for update to authenticated
  using (public.is_municipality_staff((select municipality_id from public.reports where id = report_id)))
  with check (public.is_municipality_staff((select municipality_id from public.reports where id = report_id)));

create function public.prepare_new_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  new.created_at := now();
  new.resolved_at := null;
  new.resolved_by := null;
  perform public.consume_rate_limit('flag', '{"1 hour": 20}');
  return new;
end;
$$;

create trigger prepare_new_flag
  before insert on public.content_flags
  for each row execute function public.prepare_new_flag();

revoke execute on function public.protect_municipality_columns(), public.prepare_new_flag()
from public, anon, authenticated;
