-- =====================================================
-- AJNC — Supabase schema
-- Single source of truth for church locations and the
-- per-church microsite placeholders. The website and every
-- microsite READ from these tables at runtime (anon key), so
-- edits here reflect everywhere without a redeploy.
--
-- Run this in the Supabase SQL editor.
-- =====================================================

-- ---------- Churches (Find-a-Church locations) ----------
create table if not exists public.churches (
  slug        text primary key,
  name        text not null,
  region      text check (region in ('luzon','visayas','mindanao')),
  province    text,
  city        text,
  address     text,
  pastor      text,
  services    jsonb default '[]'::jsonb,   -- e.g. ["Sunday 8:00 AM","Sunday 5:00 PM"]
  phone       text,
  website     text,
  lat         double precision,
  lng         double precision,
  sort_order  int default 0,
  updated_at  timestamptz default now()
);

-- ---------- Per-church placeholders (key/value) ----------
-- Drives the website + microsites. Bind in HTML with
--   <span data-ajnc-bind="gcash_number"></span>
--   <a data-ajnc-bind="youtube_url" data-ajnc-bind-attr="href"></a>
create table if not exists public.site_config (
  id           bigint generated always as identity primary key,
  church_slug  text not null references public.churches(slug) on delete cascade,
  key          text not null,
  value        text,
  updated_at   timestamptz default now(),
  unique (church_slug, key)
);

create index if not exists site_config_church_idx on public.site_config (church_slug);

-- ---------- Row Level Security ----------
-- Public sites only READ. Writes go through the Supabase dashboard or a
-- service-role key (never shipped to the browser).
alter table public.churches    enable row level security;
alter table public.site_config enable row level security;

drop policy if exists "public read churches" on public.churches;
create policy "public read churches"
  on public.churches for select using (true);

drop policy if exists "public read site_config" on public.site_config;
create policy "public read site_config"
  on public.site_config for select using (true);

-- =====================================================
-- Seed data (matches the site's built-in defaults)
-- =====================================================
-- Live churches carry real details. We do not publish a phone or email per
-- church. Only churches with confirmed details are listed.
insert into public.churches (slug, name, region, province, city, address, pastor, services, phone, website, lat, lng, sort_order) values
  ('cebu',       'AJNC Cebu',           'visayas',  'Cebu',              'Mandaue City',  '2nd Floor, Un Heng Building, Casuntingan, Mandaue City, Cebu',   'Pastor Mario Doromal',     '["Sunday 10:00 AM","Sunday 3:00 PM","Thursday 6:30 PM"]', null, '/microsite/?church=cebu',       10.3242, 123.9398, 1),
  ('bacolod',    'AJNC Bacolod',        'visayas',  'Negros Occidental', 'Bacolod City',  '2nd Floor, Javelosa Building, Luzuriaga Street, Bacolod City',   'Ptr. Erwin H. Espera',     '["Sunday 10:00 AM","Sunday 3:30 PM","Bible Study Tuesday 6:30 PM","Prayer Meeting Mon (Men), Thu (Ladies), Fri (Youth) 6:30 PM"]', null, '/microsite/?church=bacolod',    10.6770, 122.9500, 2),
  ('cadiz',      'AJNC Cadiz',          'visayas',  'Negros Occidental', 'Cadiz City',    'Narra 2, Brgy. Tinampaan, Cadiz City',                          'Ptr. Alfredo Z. Lopez Jr.','["Sunday 10:00 AM","Sunday 4:00 PM","Bible Study Thursday 6:00 PM","Prayer Meeting Tuesday 6:00 PM"]', null, '/microsite/?church=cadiz',      10.9476, 123.3072, 3),
  ('saravia',    'AJNC Saravia',        'visayas',  'Negros Occidental', 'Saravia',       'Boulevard, Saravia, Negros Occidental',                         'Bro. Leonil Batadlan',     '["Sunday 10:00 AM","Sunday 2:00 PM","Prayer Meeting & Bible Study Wednesday 5:30 PM"]', null, '/microsite/?church=saravia',    10.8190, 123.0386, 4),
  ('atipuluan',  'AJNC Atipuluan',      'visayas',  'Negros Occidental', 'Atipuluan',     'Prk. Greenhills, Brgy. Atipuluan, Bago City',                   'Bro. Jovin Gonzaga Jr.',   '["Sunday 10:00 AM","Sunday 3:30 PM","Bible Study Thursday 6:00 PM","Prayer Meeting Tuesday 6:00 PM"]', null, '/microsite/?church=atipuluan',  10.5552, 122.8649, 5),
  ('hinobaan',   'AJNC Hinoba-an',      'visayas',  'Negros Occidental', 'Hinoba-an',     'Prk. 4, Brgy. 2, Hinoba-an, Negros Occidental',                 'Ptr. Lewis Lidres',        '["Sunday 9:00 AM","Bible Study 6:30 PM","Prayer Meeting Tuesday 6:30 PM"]', null, '/microsite/?church=hinobaan',   9.5947,  122.4694, 6),
  ('kabankalan', 'AJNC Kabankalan',     'visayas',  'Negros Occidental', 'Kabankalan City','Across NoCeCo Main Office, Sitio Naga, Brgy. Binicuil, Kabankalan City', 'Bro. Mario G. Doromal','["Sunday 10:00 AM","Sunday 3:00 PM","Bible Study Thursday 6:30 PM","Prayer Meeting Tuesday 6:30 PM"]', null, '/microsite/?church=kabankalan', 9.9889,  122.8131, 7)
on conflict (slug) do nothing;

-- Per-church placeholders for the site/microsite. No contact phone or email is
-- published; giving numbers (GCash/Maya) are payment details, not contacts.
insert into public.site_config (church_slug, key, value) values
  ('cebu', 'gcash_number',  '0917 555 4673'),
  ('cebu', 'gcash_name',    'AJNC Cebu Inc.'),
  ('cebu', 'maya_number',   '0917 555 4673'),
  ('cebu', 'bpi_account',   '9069-1250-66'),
  ('cebu', 'youtube_url',   'https://www.youtube.com/@ajnccebu'),
  ('cebu', 'service_times', 'Sunday 10:00 AM & 3:00 PM · Thursday 6:30 PM')
on conflict (church_slug, key) do nothing;
