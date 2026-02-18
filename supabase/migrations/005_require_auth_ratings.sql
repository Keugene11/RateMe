-- Require authentication to insert ratings (so we can track per-user count)
DROP POLICY IF EXISTS "Anyone can insert ratings" ON ratings;
CREATE POLICY "Authenticated users can insert ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
