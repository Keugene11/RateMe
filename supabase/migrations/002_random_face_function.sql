-- Function to get a random face, optionally excluding a list of IDs
create or replace function get_random_face(exclude_ids uuid[] default '{}')
returns table (
  id uuid,
  image_url text,
  created_at timestamptz
)
language sql
as $$
  select f.id, f.image_url, f.created_at
  from public.faces f
  where f.id != all(exclude_ids)
  order by random()
  limit 1;
$$;
