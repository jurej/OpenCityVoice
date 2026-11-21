-- Base map style shown to visitors who have not picked one themselves.
alter table public.municipalities
  add column default_map_style text not null default 'map'
  check (default_map_style in ('map', 'detailed', 'satellite'));
