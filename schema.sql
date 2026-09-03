-- FORME · Supabase setup
-- Run this entire file once in Supabase Dashboard → SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  slug text not null check (char_length(slug) between 1 and 40),
  kind text not null default 'category' check (kind in ('category', 'tag')),
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_user_kind_slug_idx
  on public.categories (user_id, kind, lower(slug));

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  category_id uuid not null references public.categories(id) on delete restrict,
  image_url text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_user_created_idx on public.items (user_id, created_at desc);
create index if not exists items_category_idx on public.items (category_id);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  top_id uuid constraint outfits_top_id_fkey references public.items(id) on delete set null,
  bottom_id uuid constraint outfits_bottom_id_fkey references public.items(id) on delete set null,
  shoes_id uuid constraint outfits_shoes_id_fkey references public.items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (top_id is not null or bottom_id is not null or shoes_id is not null)
);

create index if not exists outfits_user_created_idx on public.outfits (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at before update on public.items
for each row execute function public.set_updated_at();

drop trigger if exists outfits_set_updated_at on public.outfits;
create trigger outfits_set_updated_at before update on public.outfits
for each row execute function public.set_updated_at();

create or replace function public.create_default_wardrobe_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, slug, kind, is_system) values
    (new.id, 'Headwear', 'headwear', 'category', true),
    (new.id, 'Top', 'top', 'category', true),
    (new.id, 'Outerwear', 'outerwear', 'category', true),
    (new.id, 'Bottom', 'bottom', 'category', true),
    (new.id, 'Shoes', 'shoes', 'category', true),
    (new.id, 'Accessories', 'accessories', 'category', true)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_wardrobe on auth.users;
create trigger on_auth_user_created_create_wardrobe
after insert on auth.users for each row execute function public.create_default_wardrobe_categories();

insert into public.categories (user_id, name, slug, kind, is_system)
select u.id, defaults.name, defaults.slug, 'category', true
from auth.users u
cross join (values
  ('Headwear', 'headwear'), ('Top', 'top'), ('Outerwear', 'outerwear'),
  ('Bottom', 'bottom'), ('Shoes', 'shoes'), ('Accessories', 'accessories')
) as defaults(name, slug)
on conflict do nothing;

alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.outfits enable row level security;

drop policy if exists "Users manage own categories" on public.categories;
drop policy if exists "Users read own categories" on public.categories;
drop policy if exists "Users create custom categories" on public.categories;
drop policy if exists "Users update custom categories" on public.categories;
drop policy if exists "Users delete custom categories" on public.categories;

create policy "Users read own categories" on public.categories
for select using (auth.uid() = user_id);

create policy "Users create custom categories" on public.categories
for insert with check (auth.uid() = user_id and is_system = false);

create policy "Users update custom categories" on public.categories
for update using (auth.uid() = user_id and is_system = false)
with check (auth.uid() = user_id and is_system = false);

create policy "Users delete custom categories" on public.categories
for delete using (auth.uid() = user_id and is_system = false);

drop policy if exists "Users manage own items" on public.items;
create policy "Users manage own items" on public.items
for all using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.categories c
    where c.id = category_id and c.user_id = auth.uid() and c.kind = 'category'
  )
);

drop policy if exists "Users manage own outfits" on public.outfits;
create policy "Users manage own outfits" on public.outfits
for all using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (top_id is null or exists (select 1 from public.items i where i.id = top_id and i.user_id = auth.uid()))
  and (bottom_id is null or exists (select 1 from public.items i where i.id = bottom_id and i.user_id = auth.uid()))
  and (shoes_id is null or exists (select 1 from public.items i where i.id = shoes_id and i.user_id = auth.uid()))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clothing-items', 'clothing-items', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "Users can read own clothing images" on storage.objects;
create policy "Users can read own clothing images" on storage.objects
for select using (bucket_id = 'clothing-items' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload own clothing images" on storage.objects;
create policy "Users can upload own clothing images" on storage.objects
for insert with check (bucket_id = 'clothing-items' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own clothing images" on storage.objects;
create policy "Users can update own clothing images" on storage.objects
for update using (bucket_id = 'clothing-items' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'clothing-items' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own clothing images" on storage.objects;
create policy "Users can delete own clothing images" on storage.objects
for delete using (bucket_id = 'clothing-items' and (storage.foldername(name))[1] = auth.uid()::text);
