ALTER TABLE donations ADD COLUMN IF NOT EXISTS cause text DEFAULT 'general';
