import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

const ALLOWED_ORIGINS = new Set([
  'https://www.buildbitachon.org',
  'https://buildbitachon.org',
])

// Simple in-memory rate limit: max 10 payment-intent creations per IP per 10 minutes
const rateMap = new Map<string, { count: number; start: number }>()
function isRateLimited(ip: string) {
  const now = Date.now()
  const entry = rateMap.get(ip) || { count: 0, start: now }
  if (now - entry.start > 10 * 60 * 1000) {
    rateMap.set(ip, { count: 1, start: now })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  rateMap.set(ip, entry)
  return false
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : ALLOWED_ORIGINS.values().next().value!

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  if (!ALLOWED_ORIGINS.has(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin },
    })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin },
    })
  }

  try {
    const { amount, userId, userEmail } = await req.json()
    const parsedAmount = Number(amount)
    if (!parsedAmount || !isFinite(parsedAmount) || parsedAmount < 0.5 || parsedAmount > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin },
      })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parsedAmount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: userEmail || undefined,
      metadata: { userId: userId || '', amount: String(parsedAmount) },
    })

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
      },
    })
  }
})
