-- Add user_id to faces (nullable for existing rows)
alter table public.faces
  add column user_id uuid references auth.users(id) on delete set null;

-- Add user_id to ratings (nullable, anonymous rating allowed)
alter table public.ratings
  add column user_id uuid references auth.users(id) on delete set null;

-- Indexes for lookups by user
create index idx_faces_user_id on public.faces(user_id);
create index idx_ratings_user_id on public.ratings(user_id);

-- Replace faces insert policy: only authenticated users can insert
drop policy "Anyone can insert faces" on public.faces;
create policy "Authenticated users can insert faces"
  on public.faces for insert
  with check (auth.uid() is not null);

-- Ratings insert policy stays open (anonymous rating allowed)
