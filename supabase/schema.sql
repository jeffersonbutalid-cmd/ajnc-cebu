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
insert into public.churches (slug, name, region, province, city, address, pastor, services, phone, website, lat, lng, sort_order) values
  ('cebu',     'AJNC Cebu',           'visayas',  'Cebu',              'Mandaue City',   'P. Burgos St., Mandaue City, Cebu 6014', 'Pastor Reyes',     '["Sunday 8:00 AM","Sunday 5:00 PM","Wednesday 7:00 PM"]', '+63 32 000 0000', '/churches/cebu',            10.3242, 123.9398, 1),
  ('manila',   'AJNC Manila',         'luzon',    'Metro Manila',      'Quezon City',    'Sample Street, Quezon City, Metro Manila', 'Pastor Cruz',    '["Sunday 9:00 AM","Sunday 6:00 PM"]',                     '+63 2 0000 0000', '/churches/manila',          14.6760, 121.0437, 2),
  ('davao',    'AJNC Davao',          'mindanao', 'Davao del Sur',     'Davao City',     'Sample Street, Davao City',                'Pastor Mendoza', '["Sunday 8:00 AM","Sunday 5:00 PM"]',                     '+63 82 000 0000', '/churches/davao',           7.0731,  125.6128, 3),
  ('iloilo',   'AJNC Iloilo',         'visayas',  'Iloilo',            'Iloilo City',    'Sample Street, Iloilo City',               'Pastor Santos',  '["Sunday 9:00 AM","Sunday 5:00 PM"]',                     '+63 33 000 0000', '/churches/iloilo',          10.7202, 122.5621, 4),
  ('cdo',      'AJNC Cagayan de Oro', 'mindanao', 'Misamis Oriental',  'Cagayan de Oro', 'Sample Street, Cagayan de Oro',            'Pastor Ramos',   '["Sunday 8:30 AM","Sunday 5:00 PM"]',                     '+63 88 000 0000', '/churches/cagayan-de-oro',  8.4542,  124.6319, 5),
  ('baguio',   'AJNC Baguio',         'luzon',    'Benguet',           'Baguio City',    'Sample Street, Baguio City',               'Pastor Garcia',  '["Sunday 9:00 AM","Sunday 5:00 PM"]',                     '+63 74 000 0000', '/churches/baguio',          16.4023, 120.5960, 6),
  ('bacolod',  'AJNC Bacolod',        'visayas',  'Negros Occidental', 'Bacolod City',   'Sample Street, Bacolod City',              'Pastor Dela Cruz','["Sunday 8:00 AM","Sunday 5:00 PM"]',                    '+63 34 000 0000', '/churches/bacolod',         10.6770, 122.9500, 7),
  ('pampanga', 'AJNC Pampanga',       'luzon',    'Pampanga',          'Angeles City',   'Sample Street, Angeles City, Pampanga',    'Pastor Lim',     '["Sunday 9:00 AM","Sunday 5:00 PM"]',                     '+63 45 000 0000', '/churches/pampanga',        15.1450, 120.5887, 8)
on conflict (slug) do nothing;

-- Example placeholders for the Cebu site/microsite. Add rows per church.
insert into public.site_config (church_slug, key, value) values
  ('cebu', 'gcash_number',  '0917 555 4673'),
  ('cebu', 'gcash_name',    'AJNC Cebu Inc.'),
  ('cebu', 'maya_number',   '0917 555 4673'),
  ('cebu', 'bpi_account',   '9069-1250-66'),
  ('cebu', 'youtube_url',   'https://www.youtube.com/@ajnccebu'),
  ('cebu', 'contact_email', 'hello@ajnc.ph'),
  ('cebu', 'contact_phone', '+63 917 555 4673'),
  ('cebu', 'service_times', 'Sunday 10:00 AM & 3:00 PM · Thursday 6:30 PM')
on conflict (church_slug, key) do nothing;
