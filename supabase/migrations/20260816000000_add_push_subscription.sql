-- Stores the browser's Web Push subscription (endpoint + encryption keys)
-- so the server can send real background push notifications, instead of
-- relying on a client-side setTimeout that only fires while the app is
-- actually open.
ALTER TABLE user_data ADD COLUMN IF NOT EXISTS push_subscription jsonb;
