CREATE TABLE IF NOT EXISTS user_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  streak integer DEFAULT 0,
  last_streak_date text,
  pushka_balance numeric DEFAULT 0,
  pending_payment numeric DEFAULT 0,
  pile_coins jsonb DEFAULT '[]',
  pushka_goal numeric DEFAULT 100,
  total_personal numeric DEFAULT 0,
  donations jsonb DEFAULT '[]',
  auto_pay_enabled boolean DEFAULT false,
  auto_pay_threshold numeric DEFAULT 180,
  reminder_enabled boolean DEFAULT false,
  reminder_time text DEFAULT '09:00',
  reminder_frequency text DEFAULT 'daily',
  recurring_enabled boolean DEFAULT false,
  recurring_amount numeric DEFAULT 18,
  recurring_frequency text DEFAULT 'weekly',
  last_recurring_date timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_data' AND policyname = 'users_own_data') THEN
    CREATE POLICY "users_own_data" ON user_data
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
