-- Lock down the donations table before public Play Store launch:
-- 1. Nothing can be inserted as pre-confirmed — closes the "insert a fake
--    $50,000 confirmed donation via the public anon key" hole.
-- 2. Only the admin can UPDATE a donation (e.g. to mark Zelle/card verified) —
--    there was previously NO update policy at all, so RLS silently denied
--    every update, meaning the admin "Verify" button never actually worked.
-- 3. SELECT is limited to your own donations, or all of them if you're the
--    admin — closes the "anyone can read every donor's email/notes" hole.

DROP POLICY IF EXISTS "allow_select" ON donations;
DROP POLICY IF EXISTS "select_own" ON donations;
DROP POLICY IF EXISTS "allow_insert" ON donations;

CREATE POLICY "select_own_or_admin" ON donations FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR (auth.jwt() ->> 'email') = 'adlaber@gmail.com'
  );

CREATE POLICY "insert_pending_only" ON donations FOR INSERT
  WITH CHECK (status = 'pending_verification');

CREATE POLICY "admin_update" ON donations FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'adlaber@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'adlaber@gmail.com');
