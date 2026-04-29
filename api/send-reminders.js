import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

// Returns true if the reminder should fire now based on frequency + time
// reminder_time is stored as local America/New_York time (e.g. "09:00")
function shouldSendNow(reminderTime, reminderFrequency) {
      const now = new Date();

  // Get current hour and minute in America/New_York local time
  const nyTime = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
  }).formatToParts(now);

  const currentHour = parseInt(nyTime.find(p => p.type === 'hour').value, 10);
      const currentMin = parseInt(nyTime.find(p => p.type === 'minute').value, 10);

  const [hh, mm] = (reminderTime || '09:00').split(':').map(Number);

  // Match within the same hour (cron runs every hour)
  if (currentHour !== hh) return false;

  // Allow a 5-minute window
  if (Math.abs(currentMin - mm) > 5) return false;

  // Get current day of week in NY timezone
  const dayStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short',
  }).format(now);

  // 'Sun'=0, 'Mon'=1, ..., 'Fri'=5, 'Sat'=6
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const day = dayMap[dayStr];

  if (reminderFrequency === 'daily') return true;
      if (reminderFrequency === 'weekly') return day === 0; // Sunday
  if (reminderFrequency === 'shabbat') return day === 5; // Friday (Erev Shabbat)
  return true;
}

export default async function handler(req, res) {
      // Only allow cron calls with secret
  const authHeader = req.headers['authorization'];
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
              return res.status(401).json({ error: 'Unauthorized' });
      }

  console.log('send-reminders: starting, env check:', {
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasResendKey: !!process.env.RESEND_API_KEY,
          hasCronSecret: !!process.env.CRON_SECRET,
  });

  try {
          // Get all users with reminders enabled
        const { data: rows, error } = await supabase
            .from('user_data')
            .select('user_id, reminder_time, reminder_frequency, pushka_balance, pushka_goal, coins')
            .eq('reminder_enabled', true);

        if (error) {
                  console.error('user_data query error:', error);
                  throw error;
        }

        console.log('user_data rows found:', rows ? rows.length : 0);

        if (!rows || rows.length === 0) return res.json({ sent: 0 });

        let sent = 0;
          const errors = [];

        for (const row of rows) {
                  if (!shouldSendNow(row.reminder_time, row.reminder_frequency)) continue;

            // Get user email from Supabase auth
            try {
                        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(row.user_id);
                        if (userError) {
                                      console.error('getUserById error for', row.user_id, ':', userError);
                                      continue;
                        }
                        if (!userData?.user?.email) {
                                      console.log('no email for user', row.user_id);
                                      continue;
                        }

                    const email = userData.user.email;
                        const balance = parseFloat(row.pushka_balance || 0).toFixed(2);
                        const goal = row.pushka_goal || 100;
                        const percent = Math.min(100, Math.round((balance / goal) * 100));

                    await resend.emails.send({
                                  from: 'Jewish Greenbush Chabad <onboarding@resend.dev>',
                                  to: email,
                                  subject: '\uD83E\uDE99 Time to add to your Pushka!',
                                  html: `
                                              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0f1629; color: #fff; border-radius: 16px; overflow: hidden;">
                                                            <div style="background: linear-gradient(135deg, #1a2a5e, #2d4a9e); padding: 32px 24px; text-align: center;">
                                                                            <div style="font-size: 48px; margin-bottom: 8px;">\uD83E\uDE99</div>
                                                                                            <h1 style="margin: 0; font-size: 24px; color: #fff;">Your Pushka is waiting!</h1>
                                                                                                            <p style="margin: 8px 0 0; color: #a0b0d0; font-size: 14px;">\u05E6\u05D3\u05E7\u05D4 \u05EA\u05E6\u05D9\u05DC \u05DE\u05DE\u05D5\u05EA</p>
                                                                                                                          </div>
                                                                                                                                        <div style="padding: 24px;">
                                                                                                                                                        <p style="color: #c0cce0; font-size: 15px; line-height: 1.6;">
                                                                                                                                                                          Every coin counts. Your pushka is <strong style="color: #fff;">${percent}% full</strong> — you're at $${balance} of your $${goal} goal.
                                                                                                                                                                                          </p>
                                                                                                                                                                                                          <div style="background: #1a2240; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
                                                                                                                                                                                                                            <div style="background: #0f1629; border-radius: 8px; height: 12px; overflow: hidden;">
                                                                                                                                                                                                                                                <div style="background: linear-gradient(90deg, #3b6fd4, #5b8ff9); width: ${percent}%; height: 100%; border-radius: 8px;"></div>
                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                    <p style="margin: 10px 0 0; color: #7090c0; font-size: 13px;">$${balance} / $${goal}</p>
                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                    <div style="text-align: center; margin-top: 24px;">
                                                                                                                                                                                                                                                                                                                                      <a href="https://grow-web-eta.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #3b6fd4, #5b8ff9); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 15px;">
                                                                                                                                                                                                                                                                                                                                                          Add to my Pushka &rarr;
                                                                                                                                                                                                                                                                                                                                                                            </a>
                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                            <p style="color: #506080; font-size: 12px; text-align: center; margin-top: 24px;">
                                                                                                                                                                                                                                                                                                                                                                                                                              Jewish Greenbush Chabad &middot; <a href="https://grow-web-eta.vercel.app" style="color: #5b8ff9;">grow-web-eta.vercel.app</a>
                                                                                                                                                                                                                                                                                                                                                                                                                                              </p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `,
                    });
                        sent++;
                        console.log('sent email to', email);
            } catch (emailErr) {
                        console.error('email error for user', row.user_id, ':', emailErr.message);
                        errors.push({ userId: row.user_id, error: emailErr.message });
            }
        }

        return res.json({ sent, errors: errors.length ? errors : undefined });
  } catch (err) {
          console.error('send-reminders fatal error:', err.message, err);
          return res.status(500).json({ error: err.message });
  }
}
