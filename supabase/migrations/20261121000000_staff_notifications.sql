-- Per-member e-mail notification preferences for municipality staff.
alter table public.municipality_members
  add column notify_category_ids uuid[] not null default '{}',
  add column notify_comments boolean not null default true;

comment on column public.municipality_members.notify_category_ids is 'Categories for which the member is e-mailed about new reports.';
comment on column public.municipality_members.notify_comments is 'E-mail the member about new comments on reports assigned to them.';

-- Members cannot update their own row through RLS (only admins can), so preferences go through this function.
create function public.set_notification_preferences(p_municipality_id uuid, p_category_ids uuid[], p_comments boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.municipality_members
     set notify_category_ids = coalesce(
           (select array_agg(c.id) from public.categories c
             where c.municipality_id = p_municipality_id and c.id = any(p_category_ids)),
           '{}'),
         notify_comments = p_comments
   where municipality_id = p_municipality_id
     and user_id = auth.uid()
     and status = 'approved';
  if not found then
    raise exception 'Not allowed';
  end if;
end;
$$;

revoke execute on function public.set_notification_preferences(uuid, uuid[], boolean) from public, anon;
grant execute on function public.set_notification_preferences(uuid, uuid[], boolean) to authenticated;
