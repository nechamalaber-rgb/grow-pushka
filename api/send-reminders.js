import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// FIX #27 — real background push notifications alongside the existing emails
const VAPID_PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY || '').trim();
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').trim();
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:schneurlaber@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function sendPush(subscription, payload, userId) {
  if (!subscription || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    // 410/404 means the subscription is dead (uninstalled, permission revoked, etc.)
    if (err.statusCode === 410 || err.statusCode === 404) {
      await supabase.from('user_data').update({ push_subscription: null }).eq('user_id', userId).catch(() => {});
    }
  }
}

// Close-to-full threshold — triggers the "almost there" nudge below 100%
const CLOSE_THRESHOLD_PERCENT = 80;

const SITE_URL = 'https://www.buildbitachon.org';

// Shared HTML shell for all outbound emails — a slot for per-email body
// content, and a consistent footer. No images by default.
function buildEmailShell({ emoji, verse, color1, color2, bodyHtml, footerExtra = '' }) {
  return `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background: #ffffff; color: #1a1a1a;">

      <div style="background: linear-gradient(135deg, ${color1}, ${color2}); padding: 28px 24px; text-align: center;">
        <div style="font-size: 36px; margin-bottom: 8px;">${emoji}</div>
        <div style="color: rgba(255,255,255,0.9); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-family: 'Helvetica Neue', Arial, sans-serif;">Chabad of East Greenbush</div>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 16px; font-style: italic;">${verse}</p>
      </div>

      <div style="padding: 32px 28px;">
        ${bodyHtml}

        <p style="color: #333; font-size: 15px; line-height: 1.8; border-top: 1px solid #eee; padding-top: 20px; margin-bottom: 0; font-family: Georgia, serif;">
          With blessings,<br/>
          <strong>Chabad of East Greenbush</strong>
        </p>
      </div>

      <div style="background: #f5f5f5; padding: 16px 28px; text-align: center; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <p style="margin: 0; color: #999; font-size: 12px;">
          Chabad of East Greenbush · <a href="${SITE_URL}" style="color: #777;">buildbitachon.org</a>
        </p>
        ${footerExtra}
      </div>
    </div>
  `;
}

// Default schedule: Tuesday (2) and Friday (5). Users who opted into 'daily'
// get every day instead. Either way it also fires any day the pushka is
// full or close to full, regardless of frequency setting.
function getEmailContent(pushkaFull, pushkaClose, balance, goal, percent, firstName) {
  const name = firstName || 'Friend';

  if (pushkaFull) {
    return {
      emoji: '🎉',
      subject: `${name}, your pushka is full — time to donate!`,
      headline: `Dear ${name},`,
      verse: 'צדקה תציל ממות',
      message: `Your pushka has reached its goal of $${goal}!\n\nThis is the moment you've been building toward, ${name}. The coins are ready. The mitzvah is waiting. All that's left is to send your donation to Jewish Greenbush Chabad and make it real.\n\nThe Rebbe taught: act on a mitzvah the moment you have the chance. Don't let it wait.`,
      cta: 'Donate Now →',
      color1: '#c8922a',
      color2: '#f5c842',
    }
  }

  if (pushkaClose) {
    return {
      emoji: '✨',
      subject: `So close, ${name}! Your pushka is ${percent}% full`,
      headline: `Dear ${name},`,
      verse: 'כל המוסיף מוסיפין לו',
      message: `Your pushka is ${percent}% of the way to its $${goal} goal — just $${(goal - balance).toFixed(2)} left!\n\nYou're almost there, ${name}. A few more coins and this mitzvah is complete. Don't let it sit unfinished — the last stretch is often the most meaningful.\n\nAdd a coin today and cross the finish line.`,
      cta: 'Finish my Pushka →',
      color1: '#1a2a5e',
      color2: '#2d4a9e',
    }
  }

  const isFriday = new Date().getUTCDay() === 5;

  if (isFriday) {
    return {
      emoji: '🕯️',
      subject: 'Shabbat is almost here — add a coin to your Pushka',
      headline: `Dear ${name},`,
      verse: 'נר מצוה ותורה אור',
      message: `As Shabbat approaches, there is no more beautiful way to prepare than with an act of tzedakah.\n\nThe Alter Rebbe teaches that tzedakah given before Shabbat carries special power — it elevates the entire week and draws down brachos for you and your family.\n\nBefore you light candles tonight, ${name}, take a moment to add a coin to your pushka. It takes seconds, and the zechus lasts forever.\n\nWishing you and yours a Shabbat full of light, peace, and joy.`,
      cta: 'Add to my Pushka before Shabbat →',
      color1: '#c8922a',
      color2: '#f5c842',
    }
  }

  // Tuesday — regular reminder
  const options = [
    {
      subject: 'A small act — a lasting impact',
      message: `The Talmud tells us: "Tzedakah tatzil mimavet" — tzedakah saves from death. Not once. Not occasionally. Every single time.\n\nYour pushka is ${percent}% full, ${name}. Each coin you've added represents a moment of generosity, a spark of kindness sent into the world.\n\nToday, add another one. It doesn't have to be much. It just has to be.`,
    },
    {
      subject: 'The Rebbe said: Never pass up a mitzvah',
      message: `The Lubavitcher Rebbe taught that a person should never let an opportunity for a mitzvah pass by — because you never know which one tips the scale.\n\nYour pushka is ${percent}% full, ${name}. One more coin brings you — and the world — closer to something beautiful.\n\nDon't let today pass without it.`,
    },
    {
      subject: 'Your pushka is waiting',
      message: `Rabbi Akiva said: "Tzedakah is the salt of money" — it preserves and purifies everything it touches.\n\nYour pushka is ${percent}% full, ${name}. A coin at a time is more than a habit — it's a statement about who you are and what you value.\n\nAdd one today.`,
    },
  ]
  const pick = options[Math.floor(Math.random() * options.length)]
  return {
    emoji: '🪙',
    subject: pick.subject,
    headline: `Dear ${name},`,
    verse: 'צדקה תציל ממות',
    message: pick.message,
    cta: 'Add to my Pushka →',
    color1: '#1a2a5e',
    color2: '#2d4a9e',
  }
}

// Short, punchy copy for the OS notification tray — deliberately not just
// the email subject/body, which are written for a full inbox message
function getPushContent(pushkaFull, pushkaClose, balance, goal, percent, firstName) {
  const name = firstName || 'Friend';

  if (pushkaFull) {
    return {
      title: `🎉 Your pushka is full, ${name}!`,
      body: `Time to send $${goal} to Jewish Greenbush Chabad.`,
    };
  }

  if (pushkaClose) {
    return {
      title: `✨ So close, ${name}!`,
      body: `${percent}% full — just $${(goal - balance).toFixed(0)} left to reach your goal.`,
    };
  }

  const isFriday = new Date().getUTCDay() === 5;
  if (isFriday) {
    return {
      title: '🕯️ Shabbat is almost here',
      body: `Add a coin before you light candles tonight, ${name}.`,
    };
  }

  const options = [
    { title: '🪙 A little goes a long way', body: `Your pushka is ${percent}% full — add a coin today, ${name}.` },
    { title: '🪙 Never pass up a mitzvah', body: `Your pushka is waiting, ${name}. One more coin today?` },
    { title: '🪙 Your pushka is waiting', body: `${percent}% full, ${name} — keep the momentum going.` },
  ];
  return options[Math.floor(Math.random() * options.length)];
}

async function getTodayHebrewDate() {
  const now = new Date();
  const url = `https://www.hebcal.com/converter?cfg=json&gy=${now.getUTCFullYear()}&gm=${now.getUTCMonth()+1}&gd=${now.getUTCDate()}&g2h=1`;
  const resp = await fetch(url);
  const json = await resp.json();
  return { day: json.hd, month: json.hmn }; // hmn: 1=Nisan...
}

async function sendYahrtzeitEmails() {
  let hebrewDate;
  try { hebrewDate = await getTodayHebrewDate(); } catch { return; }

  const { data: matches } = await supabase
    .from('yahrtzeits')
    .select('user_id, name, hebrew_day, hebrew_month')
    .eq('hebrew_day', hebrewDate.day)
    .eq('hebrew_month', hebrewDate.month);

  if (!matches?.length) return;

  const hebrewMonthNames = ['','Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar II'];

  for (const match of matches) {
    const { data: userData } = await supabase.auth.admin.getUserById(match.user_id);
    if (!userData?.user?.email) continue;

    const hebDate = `${match.hebrew_day} ${hebrewMonthNames[match.hebrew_month]}`;
    const bodyHtml = `
      <p style="font-size: 17px; line-height: 1.8; color: #1a1a1a; margin-top: 0;">Today, ${hebDate}, is the yahrtzeit of <strong>${match.name}</strong>.</p>
      <p style="font-size: 15px; line-height: 1.8; color: #333;">One of the greatest ways to honor a soul and elevate it in Gan Eden is through tzedakah given in their memory.</p>
      <p style="font-size: 15px; line-height: 1.8; color: #333;">Add a coin to your pushka today — l'ilui nishmat <strong>${match.name}</strong>. Each act of charity you do in their name is a candle that burns for them forever.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${SITE_URL}" style="display: inline-block; background: linear-gradient(135deg, #1a1a2e, #3a3a5c); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: bold; font-size: 15px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          Donate l'ilui nishmatan →
        </a>
      </div>
    `;

    await resend.emails.send({
      from: 'Jewish Greenbush Chabad <reminders@buildbitachon.org>',
      to: userData.user.email,
      subject: `Today is the yahrtzeit of ${match.name} — donate l'ilui nishmatan`,
      html: buildEmailShell({
        emoji: '🕯️',
        verse: 'תהא נשמתה/ו צרורה בצרור החיים',
        color1: '#1a1a2e',
        color2: '#3a3a5c',
        bodyHtml,
      }),
    });
  }
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const targetUserId = req.query?.user_id;

    // Send yahrtzeit emails first (runs every day regardless of reminder schedule) —
    // skipped for single-user targeted sends so a manual trigger doesn't fan out
    if (!targetUserId) await sendYahrtzeitEmails();

    let query = supabase
      .from('user_data')
      .select('user_id, pushka_balance, pushka_goal, reminder_enabled, last_reminded_at, push_subscription')
      .neq('reminder_enabled', false);
    if (targetUserId) query = query.eq('user_id', targetUserId);

    const { data: rows, error } = await query;

    if (error) throw error;
    if (!rows || rows.length === 0) return res.json({ sent: 0 });

    let sent = 0;
    const errors = [];

    for (const row of rows) {
      const balance = parseFloat(row.pushka_balance || 0);
      const goal = parseFloat(row.pushka_goal || 100);
      const pushkaFull = balance >= goal;
      const pushkaClose = !pushkaFull && goal > 0 && (balance / goal) * 100 >= CLOSE_THRESHOLD_PERCENT;

      const force = req.query?.force === 'true';
      // Everyone gets a reminder every time the cron runs (fixed daily 9:00 AM
      // ET) — no per-user custom time; the last-23h dedup below is what
      // actually keeps this to once a day per person.

      // Deduplicate: skip if already emailed within 23 hours
      if (row.last_reminded_at) {
        const lastSent = new Date(row.last_reminded_at);
        const hoursSince = (Date.now() - lastSent.getTime()) / 3600000;
        if (hoursSince < 23) continue;
      }

      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(row.user_id);
      if (userError || !userData?.user?.email) continue;

      const email = userData.user.email;
      const firstName = userData.user.user_metadata?.full_name?.split(' ')[0] || null;
      const percent = Math.min(100, Math.round((balance / goal) * 100));
      const content = getEmailContent(pushkaFull, pushkaClose, balance.toFixed(2), goal, percent, firstName);

      try {
        await supabase.from('user_data').update({ last_reminded_at: new Date().toISOString() }).eq('user_id', row.user_id);

        const bodyHtml = `
          <p style="font-size: 16px; line-height: 1.8; color: #1a1a1a; margin-top: 0; margin-bottom: 4px; font-weight: 700;">${content.headline}</p>
          <p style="font-size: 16px; line-height: 1.8; color: #1a1a1a; margin-top: 0; white-space: pre-line;">${content.message}</p>

          <div style="border: 1px solid #e8e8e8; border-radius: 10px; padding: 18px; margin: 28px 0; background: #fafafa;">
            <p style="margin: 0 0 10px; color: #555; font-size: 13px; font-family: 'Helvetica Neue', Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">Your Pushka</p>
            <div style="background: #e8e8e8; border-radius: 6px; height: 10px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, ${content.color1}, ${content.color2}); width: ${percent}%; height: 100%; border-radius: 6px;"></div>
            </div>
            <p style="margin: 10px 0 0; color: #777; font-size: 13px; font-family: 'Helvetica Neue', Arial, sans-serif;">$${balance.toFixed(2)} of $${goal} goal — ${percent}% full</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${SITE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${content.color1}, ${content.color2}); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: bold; font-size: 15px; font-family: 'Helvetica Neue', Arial, sans-serif;">
              ${content.cta}
            </a>
          </div>
        `;

        const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?user_id=${row.user_id}&token=${Buffer.from(`${row.user_id}:${process.env.CRON_SECRET}`).toString('base64')}`;
        const footerExtra = `
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.35); font-size: 11px;">
            <a href="${unsubscribeUrl}" style="color: rgba(255,255,255,0.35);">Unsubscribe from reminders</a>
          </p>
        `;

        await resend.emails.send({
          from: 'Jewish Greenbush Chabad <reminders@buildbitachon.org>',
          to: email,
          subject: content.subject,
          html: buildEmailShell({
            emoji: content.emoji,
            verse: content.verse,
            color1: content.color1,
            color2: content.color2,
            bodyHtml,
            footerExtra,
          }),
        });
        sent++;
      } catch (emailErr) {
        errors.push({ email, error: emailErr.message });
      }

      // Real background push notification, alongside the email — its own
      // short-form copy, not just the email subject/body
      if (row.push_subscription) {
        const push = getPushContent(pushkaFull, pushkaClose, balance, goal, percent, firstName);
        await sendPush(row.push_subscription, {
          title: push.title,
          body: push.body,
          url: SITE_URL,
        }, row.user_id);
      }
    }

    return res.json({ sent, errors: errors.length ? errors : undefined });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
