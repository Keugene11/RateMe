-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Faces table
create table public.faces (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  created_at timestamptz not null default now()
);

-- Ratings table
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  face_id uuid not null references public.faces(id) on delete cascade,
  score int not null check (score >= 1 and score <= 10),
  created_at timestamptz not null default now()
);

-- Index for fast lookups on ratings by face_id
create index idx_ratings_face_id on public.ratings(face_id);

-- Row Level Security
alter table public.faces enable row level security;
alter table public.ratings enable row level security;

-- Policies: allow anonymous read/insert on faces
create policy "Anyone can read faces"
  on public.faces for select using (true);

create policy "Anyone can insert faces"
  on public.faces for insert with check (true);

-- Policies: allow anonymous read/insert on ratings
create policy "Anyone can read ratings"
  on public.ratings for select using (true);

create policy "Anyone can insert ratings"
  on public.ratings for insert with check (true);
