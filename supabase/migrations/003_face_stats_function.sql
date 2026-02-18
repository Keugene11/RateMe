-- Function to get rating stats for a face
create or replace function get_face_stats(target_face_id uuid)
returns table (
  average_rating numeric,
  total_ratings bigint,
  distribution jsonb
)
language plpgsql
as $$
declare
  avg_rating numeric;
  total bigint;
  dist jsonb;
begin
  -- Get average and count from ratings
  select
    coalesce(round(avg(r.score)::numeric, 1), 0),
    count(r.id)
  into avg_rating, total
  from public.ratings r
  where r.face_id = target_face_id;

  -- Build distribution object
  select coalesce(jsonb_object_agg(s.score::text, coalesce(c.cnt, 0)), '{}'::jsonb)
  into dist
  from generate_series(1, 10) as s(score)
  left join (
    select r.score, count(*) as cnt
    from public.ratings r
    where r.face_id = target_face_id
    group by r.score
  ) c on c.score = s.score;

  return query select avg_rating, total, dist;
end;
$$;
