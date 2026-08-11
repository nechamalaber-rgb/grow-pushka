import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const userId = req.query?.user_id;
  const token = req.query?.token;

  if (!userId || !token) {
    return res.status(400).send('<h2>Invalid unsubscribe link.</h2>');
  }

  const expected = Buffer.from(`${userId}:${process.env.CRON_SECRET}`).toString('base64');
  if (token !== expected) {
    return res.status(403).send('<h2>Invalid or expired unsubscribe link.</h2>');
  }

  const { error } = await supabase
    .from('user_data')
    .update({ reminder_enabled: false })
    .eq('user_id', userId);

  if (error) {
    return res.status(500).send('<h2>Something went wrong. Please try again.</h2>');
  }

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Unsubscribed</title>
        <style>
          body { font-family: Georgia, serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #fff; border-radius: 16px; padding: 40px 32px; max-width: 420px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          h1 { color: #1a2a5e; font-size: 24px; margin-bottom: 12px; }
          p { color: #555; font-size: 15px; line-height: 1.7; }
          a { display: inline-block; margin-top: 24px; background: #1a2a5e; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 48px; margin-bottom: 16px;">🕯️</div>
          <h1>You've been unsubscribed</h1>
          <p>You won't receive any more reminder emails from Jewish Greenbush Chabad.<br/><br/>You can always turn reminders back on in your app settings.</p>
          <a href="https://www.buildbitachon.org">Go back to my Pushka</a>
        </div>
      </body>
    </html>
  `);
}
