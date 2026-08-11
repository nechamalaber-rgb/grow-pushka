import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ALLOWED_ORIGINS = ['https://www.buildbitachon.org', 'https://buildbitachon.org', 'https://grow-web-eta.vercel.app']

export default async function handler(req, res) {
  const origin = req.headers.origin || ''
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  res.setHeader('Access-Control-Allow-Origin', origin)

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email } = req.body || {}
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  const safeName = String(name || 'Friend').replace(/[<>"'&]/g, '').slice(0, 80)

  try {
    await resend.emails.send({
      from: 'My Pushka <pushka@buildbitachon.org>',
      to: email,
      subject: `Welcome to My Pushka, ${safeName}! 🪙`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to My Pushka</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0f1629;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2a5e,#2a3f8f);padding:40px 40px 30px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">🪙</div>
              <h1 style="color:#C8922A;font-size:28px;margin:0 0 8px;letter-spacing:1px;">My Pushka</h1>
              <p style="color:#F5EDD8;font-size:14px;margin:0;letter-spacing:2px;opacity:0.8;">JEWISH GREENBUSH CHABAD</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#F5EDD8;font-size:20px;margin:0 0 16px;">Shalom ${safeName}! 👋</p>
              <p style="color:#d4c9b0;font-size:16px;line-height:1.7;margin:0 0 20px;">
                Welcome to <strong style="color:#C8922A;">My Pushka</strong> — your personal digital tzedakah box.
                Every coin you drop is a real act of kindness that supports Jewish life at Chabad of East Greenbush.
              </p>
              <p style="color:#d4c9b0;font-size:16px;line-height:1.7;margin:0 0 28px;">
                Your pushka is ready. Fill it up — one coin at a time.
              </p>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:10px;padding:14px 32px;text-align:center;">
                    <a href="https://www.buildbitachon.org" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;letter-spacing:0.5px;">Open My Pushka →</a>
                  </td>
                </tr>
              </table>
              <!-- Divider -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:0 0 28px;"/>
              <p style="color:#C8922A;font-size:15px;font-style:italic;text-align:center;margin:0 0 8px;">
                "צְדָקָה תַּצִּיל מִמָּוֶת"
              </p>
              <p style="color:#8898aa;font-size:13px;text-align:center;margin:0;">
                "Tzedakah saves from death." — Proverbs 10:2
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 40px;text-align:center;">
              <p style="color:#8898aa;font-size:12px;margin:0;">
                Chabad of East Greenbush · <a href="https://www.buildbitachon.org" style="color:#8898aa;">buildbitachon.org</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('welcome-email error:', err)
    return res.status(500).json({ error: 'Failed to send' })
  }
}
