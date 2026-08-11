ALTER TABLE user_data ADD COLUMN IF NOT EXISTS last_reminded_at timestamptz;
