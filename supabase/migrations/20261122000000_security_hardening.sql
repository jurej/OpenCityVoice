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

-- Per-user rate limits for content created through the API (seeds and the service role are exempt). Timestamps are set by the server
-- so they cannot be backdated to evade limits or skew "trending" sorting.
create index report_comments_author_created_idx on public.report_comments (author_id, created_at);
drop index public.reports_author_idx;
create index reports_author_created_idx on public.reports (author_id, created_at);

create function public.limit_report_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  new.created_at := now();
  new.updated_at := now();
  if (
       (select count(*) from public.reports
         where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 10
    or (select count(*) from public.reports
         where author_id = auth.uid() and created_at > now() - interval '1 day') >= 30
  ) then
    raise exception 'rate_limited';
  end if;
  return new;
end;
$$;

create trigger limit_report_rate
  before insert on public.reports
  for each row execute function public.limit_report_rate();

create function public.limit_comment_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  new.created_at := now();
  if (
       (select count(*) from public.report_comments
         where author_id = auth.uid() and created_at > now() - interval '10 minutes') >= 20
    or (select count(*) from public.report_comments
         where author_id = auth.uid() and created_at > now() - interval '1 day') >= 200
  ) then
    raise exception 'rate_limited';
  end if;
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

revoke execute on function public.limit_report_rate(), public.limit_comment_rate(), public.set_vote_created_at()
from public, anon, authenticated;
