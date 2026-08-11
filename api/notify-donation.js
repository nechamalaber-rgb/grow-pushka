import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'adlaber@gmail.com';

// Simple in-memory rate limit: max 5 requests per IP per 10 minutes
const rateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > 10 * 60 * 1000) {
    rateMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  rateMap.set(ip, entry);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const origin = req.headers['origin'] || '';
  const allowed = ['https://www.buildbitachon.org', 'https://buildbitachon.org', 'http://localhost:5173'];
  if (!allowed.includes(origin)) return res.status(403).json({ error: 'Forbidden' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests' });

  const { amount, method, cause, userEmail, notes } = req.body || {};
  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount < 0.01) return res.status(400).json({ error: 'Missing or invalid amount' });
  if (parsedAmount > 50000) return res.status(400).json({ error: 'Amount too large' });

  const sanitize = (str) => String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const label = sanitize(cause || 'General Donation');
  const methodLabel = method === 'zelle' ? 'Zelle (pending verification)' : 'Card';
  const donorDisplay = sanitize(userEmail || 'Guest');
  const safeNotes = sanitize(notes);

  try {
    await resend.emails.send({
      from: 'Jewish Greenbush Chabad <reminders@buildbitachon.org>',
      to: ADMIN_EMAIL,
      subject: `💰 New $${amount} donation received!`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f1629;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a2a5e,#2d4a9e);padding:28px 24px;text-align:center;">
            <div style="font-size:48px;margin-bottom:8px;">💰</div>
            <h1 style="margin:0;font-size:22px;color:#fff;">New Donation!</h1>
          </div>
          <div style="padding:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#7090c0;font-size:13px;padding:8px 0;border-bottom:1px solid #1a2240;">Amount</td>
                <td style="color:#fff;font-size:15px;font-weight:bold;text-align:right;padding:8px 0;border-bottom:1px solid #1a2240;">$${amount}</td>
              </tr>
              <tr>
                <td style="color:#7090c0;font-size:13px;padding:8px 0;border-bottom:1px solid #1a2240;">Method</td>
                <td style="color:#fff;font-size:14px;text-align:right;padding:8px 0;border-bottom:1px solid #1a2240;">${methodLabel}</td>
              </tr>
              <tr>
                <td style="color:#7090c0;font-size:13px;padding:8px 0;border-bottom:1px solid #1a2240;">Cause</td>
                <td style="color:#fff;font-size:14px;text-align:right;padding:8px 0;border-bottom:1px solid #1a2240;">${label}</td>
              </tr>
              <tr>
                <td style="color:#7090c0;font-size:13px;padding:8px 0;">Donor</td>
                <td style="color:#fff;font-size:14px;text-align:right;padding:8px 0;">${donorDisplay}</td>
              </tr>
              ${safeNotes ? `<tr>
                <td style="color:#7090c0;font-size:13px;padding:8px 0;border-top:1px solid #1a2240;">Note</td>
                <td style="color:#ffe878;font-size:13px;text-align:right;padding:8px 0;border-top:1px solid #1a2240;font-style:italic;">${safeNotes}</td>
              </tr>` : ''}
            </table>
            <div style="text-align:center;margin-top:24px;">
              <a href="https://www.buildbitachon.org" style="display:inline-block;background:linear-gradient(135deg,#3b6fd4,#5b8ff9);color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-weight:bold;font-size:14px;">View Pushka Dashboard →</a>
            </div>
          </div>
        </div>
      `,
    });

    // Send thank you email to donor
    if (userEmail && userEmail !== 'Guest') {
      await resend.emails.send({
        from: 'Jewish Greenbush Chabad <reminders@buildbitachon.org>',
        to: userEmail,
        subject: `🪙 Thank you for your donation to Jewish Greenbush Chabad!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background: #ffffff; color: #1a1a1a;">
            <div style="background: linear-gradient(135deg, #1a2a5e, #2d4a9e); padding: 28px 24px; text-align: center;">
              <div style="font-size: 36px; margin-bottom: 8px;">🪙</div>
              <div style="color: rgba(255,255,255,0.9); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif;">Chabad of East Greenbush</div>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 16px; font-style: italic;">צדקה תציל ממות</p>
            </div>
            <div style="padding: 32px 28px;">
              <p style="font-size: 16px; line-height: 1.8; color: #1a1a1a; margin-top: 0;">Dear Friend,</p>
              <p style="font-size: 16px; line-height: 1.8; color: #1a1a1a;">
                Thank you so much for your generous donation of <strong>$${amount}</strong> to Jewish Greenbush Chabad${label !== 'General Donation' ? ` — directed to <strong>${label}</strong>` : ''}.
              </p>
              <p style="font-size: 16px; line-height: 1.8; color: #1a1a1a;">
                Your tzedakah makes a real difference in our community. The Talmud teaches that tzedakah is equal to all other mitzvos combined — and today, you fulfilled it beautifully.
              </p>
              <p style="font-size: 16px; line-height: 1.8; color: #1a1a1a;">
                May this mitzvah bring you and your family revealed brachos, good health, and everything you need.
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="https://www.buildbitachon.org" style="display: inline-block; background: linear-gradient(135deg, #1a2a5e, #2d4a9e); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: bold; font-size: 15px; font-family: sans-serif;">
                  Go to my Pushka →
                </a>
              </div>
              <p style="color: #333; font-size: 15px; line-height: 1.8; border-top: 1px solid #eee; padding-top: 20px; margin-bottom: 0;">
                With gratitude and blessings,<br/>
                <strong>Chabad of East Greenbush</strong>
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 16px 28px; text-align: center; font-family: sans-serif;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Chabad of East Greenbush · <a href="https://www.buildbitachon.org" style="color: #777;">buildbitachon.org</a>
              </p>
            </div>
          </div>
        `,
      }).catch(() => {}); // don't fail if thank you email errors
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('notify-donation error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
