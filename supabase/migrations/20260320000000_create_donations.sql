CREATE TABLE IF NOT EXISTS donations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  amount numeric NOT NULL,
  method text DEFAULT 'card',
  user_id text,
  user_email text,
  label text DEFAULT 'Donation'
);
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'allow_insert') THEN
    CREATE POLICY "allow_insert" ON donations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'allow_select') THEN
    CREATE POLICY "allow_select" ON donations FOR SELECT USING (true);
  END IF;
END $$;
