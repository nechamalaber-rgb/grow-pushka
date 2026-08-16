-- The previous migration (20260815000000) added select_own_or_admin,
-- insert_pending_only, and admin_update — but several older policies
-- (created outside of git history, directly via the dashboard at some
-- point) were still active alongside them: admin_read_donations,
-- users_insert_donations, users_read_own_donations.
--
-- Postgres combines multiple PERMISSIVE policies for the same command
-- with OR, so users_insert_donations's unrestricted
-- WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL)) was silently
-- overriding insert_pending_only, allowing anyone to insert a donation
-- row with any status (including 'confirmed') as long as user_id was
-- left blank. Confirmed and fixed via live testing on 2026-08-15 —
-- a test row was actually able to insert as 'confirmed' before this.

DROP POLICY IF EXISTS "users_insert_donations" ON donations;
DROP POLICY IF EXISTS "admin_read_donations" ON donations;
DROP POLICY IF EXISTS "users_read_own_donations" ON donations;
