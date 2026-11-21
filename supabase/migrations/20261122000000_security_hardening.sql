-- Security hardening.

-- Trigger functions run with a fixed search_path and cannot be called through the API.
alter function public.protect_profile_columns() set search_path = '';
alter function public.touch_updated_at() set search_path = '';
alter function public.protect_report_columns() set search_path = '';

revoke execute on function
  public.handle_new_user(),
  public.seed_municipality_defaults(),
  public.prepare_new_report(),
  public.prepare_new_comment(),
  public.update_report_counters(),
  public.log_report_changes(),
  public.log_report_forward(),
  public.protect_profile_columns(),
  public.touch_updated_at(),
  public.protect_report_columns()
from public, anon, authenticated;

revoke execute on function public.set_municipality_boundary(uuid, jsonb) from public, anon;
grant execute on function public.set_municipality_boundary(uuid, jsonb) to authenticated;

-- Per-user rate limits for content created through the API (seeds and the service role are exempt).
-- Creations are logged separately so deleting content does not free up quota, and a per-user
-- advisory lock serialises concurrent inserts. Timestamps are set by the server so rows cannot be
-- backdated to skew "trending" sorting.
create table public.rate_limit_events (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_events_user_idx on public.rate_limit_events (user_id, kind, created_at);
alter table public.rate_limit_events enable row level security;

create function public.consume_rate_limit(p_kind text, p_limits jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_limit record;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || p_kind, 0));
  for v_limit in select key::interval as period, value::int as max from jsonb_each_text(p_limits) loop
    if (select count(*) from public.rate_limit_events
         where user_id = v_user and kind = p_kind and created_at > now() - v_limit.period) >= v_limit.max then
      raise exception 'rate_limited';
    end if;
  end loop;
  insert into public.rate_limit_events (user_id, kind) values (v_user, p_kind);
  delete from public.rate_limit_events
   where user_id = v_user and kind = p_kind and created_at < now() - interval '1 day';
end;
$$;

create function public.limit_report_rate()
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
  new.updated_at := now();
  perform public.consume_rate_limit('report', '{"1 hour": 10, "1 day": 30}');
  return new;
end;
$$;

create trigger limit_report_rate
  before insert on public.reports
  for each row execute function public.limit_report_rate();

create function public.limit_comment_rate()
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
  perform public.consume_rate_limit('comment', '{"10 minutes": 20, "1 day": 200}');
  return new;
end;
$$;

create trigger limit_comment_rate
  before insert on public.report_comments
  for each row execute function public.limit_comment_rate();

create function public.set_vote_created_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.created_at := now();
  end if;
  return new;
end;
$$;

create trigger set_vote_created_at
  before insert on public.report_votes
  for each row execute function public.set_vote_created_at();

revoke execute on function
  public.limit_report_rate(),
  public.limit_comment_rate(),
  public.set_vote_created_at(),
  public.consume_rate_limit(text, jsonb)
from public, anon, authenticated;
