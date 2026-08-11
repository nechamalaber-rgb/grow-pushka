ALTER TABLE donations ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed';
ALTER TABLE donations ADD COLUMN IF NOT EXISTS notes text;

-- Tighten RLS: only allow users to SELECT their own donations, but keep insert open
-- Admin reads all via service role key (bypasses RLS)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'allow_select') THEN
    DROP POLICY "allow_select" ON donations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'select_own') THEN
    CREATE POLICY "select_own" ON donations FOR SELECT
      USING (user_id::text = auth.uid()::text OR user_id IS NULL);
  END IF;
END $$;
