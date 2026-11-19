-- TownPing initial schema
-- Multi-tenant: every municipality owns its categories, statuses, members and reports.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.member_role as enum ('admin', 'staff');
create type public.member_status as enum ('pending', 'approved', 'rejected');
create type public.report_event_type as enum ('created', 'status_changed', 'assigned', 'forwarded');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  email_notifications boolean not null default true,
  locale text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public user profile. E-mail addresses stay in auth.users and are only read server-side.';

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent users from granting themselves platform admin rights.
create function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if new.is_platform_admin is distinct from old.is_platform_admin
     and current_setting('role') = 'authenticated' then
    raise exception 'Not allowed to change is_platform_admin';
  end if;
  return new;
end;
$$;

create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- Municipalities
-- ---------------------------------------------------------------------------

create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  contact_email text,
  website_url text,
  primary_color text not null default '#0f766e',
  center_lat double precision not null,
  center_lng double precision not null,
  default_zoom real not null default 13,
  boundary extensions.geography(multipolygon, 4326),
  is_active boolean not null default true,
  report_seq integer not null default 0,
  created_at timestamptz not null default now()
);

create index municipalities_boundary_idx on public.municipalities using gist (boundary);

-- ---------------------------------------------------------------------------
-- Members (municipality staff / responsible persons)
-- ---------------------------------------------------------------------------

create table public.municipality_members (
  municipality_id uuid not null references public.municipalities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'staff',
  status public.member_status not null default 'pending',
  job_title text,
  created_at timestamptz not null default now(),
  primary key (municipality_id, user_id)
);

create index municipality_members_user_idx on public.municipality_members (user_id);

-- Helper functions used by RLS policies. SECURITY DEFINER avoids recursive RLS.
create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false);
$$;

create function public.is_municipality_staff(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.municipality_members
    where municipality_id = mid and user_id = auth.uid() and status = 'approved'
  );
$$;

create function public.is_municipality_admin(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.municipality_members
    where municipality_id = mid and user_id = auth.uid() and status = 'approved' and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Categories and statuses (per municipality, localized names as jsonb)
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities (id) on delete cascade,
  name jsonb not null,
  icon text not null default 'circle-alert',
  color text not null default '#64748b',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  default_assignee_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index categories_municipality_idx on public.categories (municipality_id, sort_order);

create table public.statuses (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities (id) on delete cascade,
  name jsonb not null,
  color text not null default '#64748b',
  sort_order integer not null default 0,
  is_initial boolean not null default false,
  is_closed boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index statuses_municipality_idx on public.statuses (municipality_id, sort_order);
create unique index statuses_one_initial_idx on public.statuses (municipality_id) where is_initial;

-- Seed default categories and statuses for every new municipality.
create function public.seed_municipality_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (municipality_id, name, icon, color, sort_order) values
    (new.id, '{"en": "Road and sidewalk damage", "sl": "Poškodbe cestišča, pločnikov"}', 'construction', '#b45309', 10),
    (new.id, '{"en": "Traffic signs and signals", "sl": "Poškodbe prometne signalizacije"}', 'triangle-alert', '#dc2626', 20),
    (new.id, '{"en": "Street lighting failure", "sl": "Okvare javne razsvetljave"}', 'lightbulb', '#ca8a04', 30),
    (new.id, '{"en": "Damaged street furniture", "sl": "Poškodbe urbane opreme"}', 'armchair', '#7c3aed', 40),
    (new.id, '{"en": "Littering and illegal dumping", "sl": "Nasmeteno območje (divja odlagališča, ekološki otoki)"}', 'trash-2', '#15803d', 50),
    (new.id, '{"en": "Ideas and suggestions", "sl": "Predlogi in pobude"}', 'message-square-plus', '#2563eb', 60);

  insert into public.statuses (municipality_id, name, color, sort_order, is_initial, is_closed) values
    (new.id, '{"en": "New", "sl": "Nova"}', '#2563eb', 10, true, false),
    (new.id, '{"en": "In progress", "sl": "V delu"}', '#d97706', 20, false, false),
    (new.id, '{"en": "Resolved", "sl": "Zaključena"}', '#16a34a', 30, false, true),
    (new.id, '{"en": "Rejected", "sl": "Zavrnjena"}', '#6b7280', 40, false, true);
  return new;
end;
$$;

create trigger seed_municipality_defaults
  after insert on public.municipalities
  for each row execute function public.seed_municipality_defaults();

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities (id) on delete cascade,
  number integer not null,
  category_id uuid not null references public.categories (id),
  status_id uuid not null references public.statuses (id),
  author_id uuid not null references public.profiles (id) on delete cascade,
  assignee_id uuid references public.profiles (id) on delete set null,
  title text check (char_length(title) <= 120),
  description text not null check (char_length(description) between 3 and 4000),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(point, 4326)
    generated always as (extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography) stored,
  address text,
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  vote_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (municipality_id, number)
);

create index reports_municipality_created_idx on public.reports (municipality_id, created_at desc);
create index reports_location_idx on public.reports using gist (location);
create index reports_author_idx on public.reports (author_id);

-- Assign the per-municipality number, initial status and default assignee.
create function public.prepare_new_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.municipalities
     set report_seq = report_seq + 1
   where id = new.municipality_id
  returning report_seq into new.number;

  select id into new.status_id
    from public.statuses
   where municipality_id = new.municipality_id and is_initial
   limit 1;

  if new.status_id is null then
    raise exception 'Municipality has no initial status';
  end if;

  if not exists (
    select 1 from public.categories
     where id = new.category_id and municipality_id = new.municipality_id and is_active
  ) then
    raise exception 'Invalid category';
  end if;

  select c.default_assignee_id into new.assignee_id
    from public.categories c
    join public.municipality_members mm
      on mm.user_id = c.default_assignee_id and mm.municipality_id = c.municipality_id and mm.status = 'approved'
   where c.id = new.category_id;

  new.vote_count := 0;
  new.comment_count := 0;
  return new;
end;
$$;

create trigger prepare_new_report
  before insert on public.reports
  for each row execute function public.prepare_new_report();

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger reports_touch_updated_at
  before update on public.reports
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Votes and comments
-- ---------------------------------------------------------------------------

create table public.report_votes (
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index report_votes_user_idx on public.report_votes (user_id);

create table public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  is_official boolean not null default false,
  created_at timestamptz not null default now()
);

create index report_comments_report_idx on public.report_comments (report_id, created_at);

-- Comments are marked official automatically when written by municipality staff.
create function public.prepare_new_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.is_official := public.is_municipality_staff(
    (select municipality_id from public.reports where id = new.report_id)
  );
  return new;
end;
$$;

create trigger prepare_new_comment
  before insert on public.report_comments
  for each row execute function public.prepare_new_comment();

create function public.update_report_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid := coalesce(new.report_id, old.report_id);
begin
  if tg_table_name = 'report_votes' then
    update public.reports
       set vote_count = greatest(vote_count + case when tg_op = 'INSERT' then 1 else -1 end, 0)
     where id = rid;
  else
    update public.reports
       set comment_count = greatest(comment_count + case when tg_op = 'INSERT' then 1 else -1 end, 0)
     where id = rid;
  end if;
  return null;
end;
$$;

create trigger report_votes_counter
  after insert or delete on public.report_votes
  for each row execute function public.update_report_counters();

create trigger report_comments_counter
  after insert or delete on public.report_comments
  for each row execute function public.update_report_counters();

-- ---------------------------------------------------------------------------
-- Timeline events and forwards
-- ---------------------------------------------------------------------------

create table public.report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type public.report_event_type not null,
  from_status_id uuid references public.statuses (id) on delete set null,
  to_status_id uuid references public.statuses (id) on delete set null,
  assignee_id uuid references public.profiles (id) on delete set null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index report_events_report_idx on public.report_events (report_id, created_at);

create function public.log_report_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.report_events (report_id, actor_id, type, to_status_id)
    values (new.id, new.author_id, 'created', new.status_id);
    return new;
  end if;

  if new.status_id is distinct from old.status_id then
    insert into public.report_events (report_id, actor_id, type, from_status_id, to_status_id)
    values (new.id, auth.uid(), 'status_changed', old.status_id, new.status_id);
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into public.report_events (report_id, actor_id, type, assignee_id)
    values (new.id, auth.uid(), 'assigned', new.assignee_id);
  end if;
  return new;
end;
$$;

create trigger log_report_changes
  after insert or update of status_id, assignee_id on public.reports
  for each row execute function public.log_report_changes();

create table public.report_forwards (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  sent_by uuid references public.profiles (id) on delete set null,
  recipient_email text,
  message text check (char_length(message) <= 2000),
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now()
);

create index report_forwards_report_idx on public.report_forwards (report_id);

create function public.log_report_forward()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.report_events (report_id, actor_id, type)
  values (new.report_id, new.sent_by, 'forwarded');
  return new;
end;
$$;

create trigger log_report_forward
  after insert on public.report_forwards
  for each row execute function public.log_report_forward();

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

-- Find the municipality that contains a point.
create function public.municipality_at(p_lat double precision, p_lng double precision)
returns setof public.municipalities
language sql
stable
set search_path = ''
as $$
  select m.* from public.municipalities m
   where m.is_active
     and m.boundary is not null
     and extensions.st_covers(m.boundary, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography)
   limit 1;
$$;

-- Whether a point lies inside a municipality (true when no boundary is defined).
create function public.point_in_municipality(p_municipality_id uuid, p_lat double precision, p_lng double precision)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select m.boundary is null
         or extensions.st_covers(m.boundary, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography)
       from public.municipalities m where m.id = p_municipality_id),
    false
  );
$$;

-- Open reports near a point, used to warn about duplicates before submitting.
create function public.nearby_reports(
  p_municipality_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision default 50,
  p_category_id uuid default null
)
returns table (
  id uuid,
  number integer,
  title text,
  description text,
  category_id uuid,
  status_id uuid,
  vote_count integer,
  photos text[],
  created_at timestamptz,
  distance_m double precision
)
language sql
stable
set search_path = ''
as $$
  select r.id, r.number, r.title, r.description, r.category_id, r.status_id, r.vote_count, r.photos, r.created_at,
         extensions.st_distance(r.location, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography) as distance_m
    from public.reports r
    join public.statuses s on s.id = r.status_id
   where r.municipality_id = p_municipality_id
     and not s.is_closed
     and (p_category_id is null or r.category_id = p_category_id)
     and extensions.st_dwithin(r.location, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography, p_radius_m)
   order by distance_m
   limit 5;
$$;

-- Set a municipality boundary from GeoJSON (Polygon or MultiPolygon).
create function public.set_municipality_boundary(p_municipality_id uuid, p_geojson jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_municipality_admin(p_municipality_id) then
    raise exception 'Not allowed';
  end if;
  update public.municipalities
     set boundary = case
       when p_geojson is null then null
       else extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson(p_geojson::text), 4326))::extensions.geography
     end
   where id = p_municipality_id;
end;
$$;

-- Boundary as GeoJSON for map display.
create function public.municipality_boundary_geojson(p_municipality_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select extensions.st_asgeojson(boundary::extensions.geometry)::jsonb
    from public.municipalities where id = p_municipality_id;
$$;

-- Public read access to a forwarded report via its secret token.
create function public.get_forwarded_report(p_token uuid)
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
   where f.token = p_token and f.expires_at > now();
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.municipalities enable row level security;
alter table public.municipality_members enable row level security;
alter table public.categories enable row level security;
alter table public.statuses enable row level security;
alter table public.reports enable row level security;
alter table public.report_votes enable row level security;
alter table public.report_comments enable row level security;
alter table public.report_events enable row level security;
alter table public.report_forwards enable row level security;

-- profiles
create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- municipalities
create policy "Active municipalities are public" on public.municipalities for select
  using (is_active or public.is_municipality_staff(id));
create policy "Platform admins create municipalities" on public.municipalities for insert to authenticated
  with check (public.is_platform_admin());
create policy "Municipality admins update municipality" on public.municipalities for update to authenticated
  using (public.is_municipality_admin(id)) with check (public.is_municipality_admin(id));
create policy "Platform admins delete municipalities" on public.municipalities for delete to authenticated
  using (public.is_platform_admin());

-- municipality_members
create policy "Members visible to self and municipality staff" on public.municipality_members for select to authenticated
  using (user_id = auth.uid() or public.is_municipality_staff(municipality_id));
create policy "Users request staff access" on public.municipality_members for insert to authenticated
  with check (
    (user_id = auth.uid() and status = 'pending' and role = 'staff')
    or public.is_municipality_admin(municipality_id)
  );
create policy "Municipality admins manage members" on public.municipality_members for update to authenticated
  using (public.is_municipality_admin(municipality_id)) with check (public.is_municipality_admin(municipality_id));
create policy "Admins remove members, users withdraw" on public.municipality_members for delete to authenticated
  using (user_id = auth.uid() or public.is_municipality_admin(municipality_id));

-- categories
create policy "Categories are public" on public.categories for select using (true);
create policy "Municipality admins manage categories" on public.categories for all to authenticated
  using (public.is_municipality_admin(municipality_id)) with check (public.is_municipality_admin(municipality_id));

-- statuses
create policy "Statuses are public" on public.statuses for select using (true);
create policy "Municipality admins manage statuses" on public.statuses for all to authenticated
  using (public.is_municipality_admin(municipality_id)) with check (public.is_municipality_admin(municipality_id));

-- reports
create policy "Reports are public" on public.reports for select using (true);
create policy "Signed-in users create reports" on public.reports for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.municipalities m where m.id = municipality_id and m.is_active)
  );
create policy "Staff update reports" on public.reports for update to authenticated
  using (public.is_municipality_staff(municipality_id)) with check (public.is_municipality_staff(municipality_id));
create policy "Admins and authors delete reports" on public.reports for delete to authenticated
  using (public.is_municipality_admin(municipality_id) or author_id = auth.uid());

-- report_votes
create policy "Votes are public" on public.report_votes for select using (true);
create policy "Users vote" on public.report_votes for insert to authenticated with check (user_id = auth.uid());
create policy "Users unvote" on public.report_votes for delete to authenticated using (user_id = auth.uid());

-- report_comments
create policy "Comments are public" on public.report_comments for select using (true);
create policy "Users comment" on public.report_comments for insert to authenticated with check (author_id = auth.uid());
create policy "Authors and staff delete comments" on public.report_comments for delete to authenticated
  using (
    author_id = auth.uid()
    or public.is_municipality_staff((select municipality_id from public.reports where id = report_id))
  );

-- report_events (written by triggers only)
create policy "Events are public" on public.report_events for select using (true);

-- report_forwards
create policy "Staff see forwards" on public.report_forwards for select to authenticated
  using (public.is_municipality_staff((select municipality_id from public.reports where id = report_id)));
create policy "Staff create forwards" on public.report_forwards for insert to authenticated
  with check (
    sent_by = auth.uid()
    and public.is_municipality_staff((select municipality_id from public.reports where id = report_id))
  );

-- Staff may only change workflow fields; content stays as submitted by the citizen.
create function public.protect_report_columns()
returns trigger
language plpgsql
as $$
begin
  if current_setting('role') = 'authenticated' and (
       new.municipality_id is distinct from old.municipality_id
    or new.number is distinct from old.number
    or new.author_id is distinct from old.author_id
    or new.vote_count is distinct from old.vote_count and pg_trigger_depth() = 1
    or new.comment_count is distinct from old.comment_count and pg_trigger_depth() = 1
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.photos is distinct from old.photos
    or new.lat is distinct from old.lat
    or new.lng is distinct from old.lng
    or new.address is distinct from old.address
  ) then
    raise exception 'Not allowed to change these report fields';
  end if;
  if new.status_id is distinct from old.status_id and not exists (
    select 1 from public.statuses where id = new.status_id and municipality_id = new.municipality_id
  ) then
    raise exception 'Invalid status';
  end if;
  if new.category_id is distinct from old.category_id and not exists (
    select 1 from public.categories where id = new.category_id and municipality_id = new.municipality_id
  ) then
    raise exception 'Invalid category';
  end if;
  return new;
end;
$$;

create trigger protect_report_columns
  before update on public.reports
  for each row execute function public.protect_report_columns();

-- ---------------------------------------------------------------------------
-- Storage: report photos (public read, users upload into their own folder)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Users upload own report photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own report photos" on storage.objects for delete to authenticated
  using (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Server-only helpers (service role) for e-mail lookups
-- ---------------------------------------------------------------------------

create function public.user_emails(p_user_ids uuid[])
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text from auth.users u where u.id = any (p_user_ids);
$$;

create function public.user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
$$;

revoke execute on function public.user_emails(uuid[]) from public, anon, authenticated;
revoke execute on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_emails(uuid[]) to service_role;
grant execute on function public.user_id_by_email(text) to service_role;
