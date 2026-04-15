import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function shouldSendNow(reminderFrequency: string): boolean {
  // Send at 2pm Eastern (18:00 UTC in EDT / 19:00 UTC in EST)
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();

  // Match 18:00 UTC (2pm EDT) within a 2-minute window
  if (utcHour !== 18 || utcMin > 2) return false;

  const day = now.getUTCDay();
  if (reminderFrequency === 'daily') return true;
  if (reminderFrequency === 'weekly') return day === 0;
  if (reminderFrequency === 'shabbat') return day === 5;
  return true;
}

Deno.serve(async (req) => {
  // Allow GET or POST
  try {
    const { data: rows, error } = await supabase
      .from('user_data')
      .select('user_id, reminder_time, reminder_frequency, pushka_balance, pushka_goal')
      .eq('reminder_enabled', true);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    if (!rows || rows.length === 0) return new Response(JSON.stringify({ sent: 0, reason: 'no users with reminders' }), { status: 200 });

    let sent = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (!shouldSendNow(row.reminder_frequency)) continue;

      const { data: userData } = await supabase.auth.admin.getUserById(row.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const balance = parseFloat(row.pushka_balance || 0).toFixed(2);
      const goal = row.pushka_goal || 100;
      const percent = Math.min(100, Math.round((parseFloat(balance) / goal) * 100));

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Jewish Greenbush Chabad <reminders@buildbitachon.org>',
          to: email,
          subject: '🪙 Time to add to your Pushka!',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f1629;color:#fff;border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#1a2a5e,#2d4a9e);padding:32px 24px;text-align:center;">
                <div style="font-size:48px;margin-bottom:8px;">🪙</div>
                <h1 style="margin:0;font-size:24px;color:#fff;">Your Pushka is waiting!</h1>
                <p style="margin:8px 0 0;color:#a0b0d0;font-size:14px;">צדקה תציל ממות</p>
              </div>
              <div style="padding:24px;">
                <p style="color:#c0cce0;font-size:15px;line-height:1.6;">
                  Your pushka is <strong style="color:#fff;">${percent}% full</strong> — $${balance} of your $${goal} goal.
                </p>
                <div style="background:#1a2240;border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
                  <div style="background:#0f1629;border-radius:8px;height:12px;overflow:hidden;">
                    <div style="background:linear-gradient(90deg,#3b6fd4,#5b8ff9);width:${percent}%;height:100%;border-radius:8px;"></div>
                  </div>
                  <p style="margin:10px 0 0;color:#7090c0;font-size:13px;">$${balance} / $${goal}</p>
                </div>
                <div style="text-align:center;margin-top:24px;">
                  <a href="https://grow-web-eta.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#3b6fd4,#5b8ff9);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:bold;font-size:15px;">
                    Add to my Pushka →
                  </a>
                </div>
                <p style="color:#506080;font-size:12px;text-align:center;margin-top:24px;">Jewish Greenbush Chabad</p>
              </div>
            </div>
          `,
        }),
      });

      if (emailRes.ok) {
        sent++;
      } else {
        const err = await emailRes.text();
        errors.push(`${email}: ${err}`);
      }
    }

    return new Response(JSON.stringify({ sent, errors: errors.length ? errors : undefined }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
