import { useState, useRef, useEffect } from 'react'
import './App.css'
import { supabase } from './supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const SLIDES = [
  '/slides/pesach2.jpg',
  '/slides/pesach3.jpg',
  '/slides/pesach4.jpg',
  '/slides/pesach5.jpg',
  '/slides/pesach6.jpg',
  '/slides/slide1.jpg',
  '/slides/slide2.jpg',
  '/slides/slide3.jpg',
  '/slides/slide4.jpg',
  '/slides/slide5.jpg',
  '/slides/slide6.jpg',
  '/slides/slide7.jpg',
]

function SlideshowBg() {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="slideshow-bg">
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className={`slide ${i === current ? 'active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  )
}

const ACTIVITY_DATA = [
  { src: '/slides/pesach2.jpg', emoji: '🍷', label: 'Pesach Seder',           sub: 'Beautiful Seder tables' },
  { src: '/slides/pesach3.jpg', emoji: '🥗', label: 'Yom Tov Meals',          sub: 'Fresh, abundant spreads' },
  { src: '/slides/pesach4.jpg', emoji: '⛹️', label: 'Chol HaMoed Fun',        sub: 'Kids active & together' },
  { src: '/slides/pesach5.jpg', emoji: '❤️', label: 'Family Moments',         sub: 'Together on Yom Tov' },
  { src: '/slides/pesach6.jpg', emoji: '🌿', label: 'Chol HaMoed Outdoors',   sub: 'Nature & fresh air' },
  { src: '/slides/slide1.jpg', emoji: '🤝', label: 'Girls Retreat',          sub: 'Sisters by the lake' },
  { src: '/slides/slide2.jpg', emoji: '💗', label: 'Girls Unite',            sub: 'The Chabad community' },
  { src: '/slides/slide3.jpg', emoji: '🌟', label: 'GROW Girls',             sub: 'Jewish girls thriving' },
  { src: '/slides/slide4.jpg', emoji: '🎉', label: 'Chabad Team',            sub: 'Growing together' },
  { src: '/slides/slide5.jpg', emoji: '😊', label: 'Friendship & Joy',       sub: 'Lifelong bonds' },
  { src: '/slides/slide6.jpg', emoji: '🔥', label: 'Shabbaton',              sub: 'Campfire memories' },
  { src: '/slides/slide7.jpg', emoji: '🕯️', label: 'Havdalah Night',        sub: 'Jewish light & warmth' },
]

function PhotoStrip() {
  return (
    <div className="photo-strip-section">
      <div className="photo-strip-header">
        <span className="photo-strip-label">CHABAD OF EAST GREENBUSH</span>
        <span className="photo-strip-sub">Swipe to explore →</span>
      </div>
      <div className="photo-strip">
        {ACTIVITY_DATA.map((item) => (
          <div key={item.label} className="photo-strip-card">
            <div
              className="photo-strip-img"
              style={{ backgroundImage: `url(${item.src})` }}
            />
            <div className="photo-strip-caption-block">
              <span className="photo-strip-emoji">{item.emoji}</span>
              <span className="photo-strip-caption">{item.label}</span>
              <span className="photo-strip-caption-sub">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── STRIPE PAYMENT FORM ──
function PaymentForm({ amount, onSuccess, onClose }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin },
      redirect: 'if_required',
    })
    if (stripeError) {
      setError(stripeError.message)
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="payment-modal" onClick={e => e.stopPropagation()}>
      <div className="payment-modal-header">
        <div className="payment-modal-title">Complete Donation</div>
        <div className="payment-modal-amount">${amount.toFixed(2)}</div>
        <button className="payment-modal-close" onClick={onClose}>✕</button>
      </div>
      <PaymentElement />
      {error && <div className="payment-modal-error">{error}</div>}
      <button className="payment-modal-btn" onClick={handleSubmit} disabled={loading || !stripe}>
        {loading ? 'Processing...' : `Donate $${amount.toFixed(2)}`}
      </button>
      <div className="payment-modal-secure">🔒 Secured by Stripe</div>
    </div>
  )
}

// Fixed scattered positions for the coin pile — outside component so PushkaVisual doesn't remount
// y values start at 30 to clear the pushka body's rounded-bottom clipping zone
const PILE_POSITIONS = [
  // row 1 — bottom (y=30, above the 28px rounded bottom cap)
  { x: 4,   y: 30,  r: -10, s: 1.0 },
  { x: 26,  y: 29,  r: 8,   s: 1.0 },
  { x: 50,  y: 30,  r: -5,  s: 1.0 },
  { x: 74,  y: 28,  r: 13,  s: 1.0 },
  { x: 98,  y: 30,  r: -8,  s: 1.0 },
  { x: 120, y: 29,  r: 6,   s: 1.0 },
  // row 2
  { x: 14,  y: 46,  r: 11,  s: 1.0 },
  { x: 38,  y: 47,  r: -15, s: 1.0 },
  { x: 62,  y: 45,  r: 5,   s: 1.0 },
  { x: 86,  y: 47,  r: -9,  s: 1.0 },
  { x: 110, y: 46,  r: 14,  s: 1.0 },
  // row 3
  { x: 3,   y: 62,  r: -7,  s: 1.0 },
  { x: 27,  y: 63,  r: 12,  s: 1.0 },
  { x: 51,  y: 61,  r: -13, s: 1.0 },
  { x: 75,  y: 63,  r: 7,   s: 1.0 },
  { x: 99,  y: 62,  r: -11, s: 1.0 },
  { x: 121, y: 63,  r: 9,   s: 1.0 },
  // row 4
  { x: 14,  y: 78,  r: 14,  s: 1.0 },
  { x: 38,  y: 79,  r: -6,  s: 1.0 },
  { x: 62,  y: 77,  r: 10,  s: 1.0 },
  { x: 86,  y: 79,  r: -14, s: 1.0 },
  { x: 110, y: 78,  r: 5,   s: 1.0 },
  // row 5
  { x: 4,   y: 94,  r: -9,  s: 1.0 },
  { x: 28,  y: 95,  r: 13,  s: 1.0 },
  { x: 52,  y: 93,  r: -5,  s: 1.0 },
  { x: 76,  y: 95,  r: 11,  s: 1.0 },
  { x: 100, y: 94,  r: -12, s: 1.0 },
  { x: 122, y: 95,  r: 7,   s: 1.0 },
  // row 6
  { x: 15,  y: 110, r: 6,   s: 1.0 },
  { x: 39,  y: 111, r: -11, s: 1.0 },
  { x: 63,  y: 109, r: 9,   s: 1.0 },
  { x: 87,  y: 111, r: -7,  s: 1.0 },
  { x: 111, y: 110, r: 12,  s: 1.0 },
  // row 7
  { x: 4,   y: 126, r: -8,  s: 1.0 },
  { x: 28,  y: 127, r: 10,  s: 1.0 },
  { x: 52,  y: 125, r: -13, s: 1.0 },
  { x: 76,  y: 127, r: 6,   s: 1.0 },
  { x: 100, y: 126, r: -10, s: 1.0 },
  { x: 122, y: 127, r: 8,   s: 1.0 },
  // row 8
  { x: 14,  y: 142, r: 11,  s: 1.0 },
  { x: 38,  y: 143, r: -7,  s: 1.0 },
  { x: 62,  y: 141, r: 9,   s: 1.0 },
  { x: 86,  y: 143, r: -12, s: 1.0 },
  { x: 110, y: 142, r: 5,   s: 1.0 },
  // row 9
  { x: 4,   y: 158, r: -10, s: 1.0 },
  { x: 28,  y: 159, r: 8,   s: 1.0 },
  { x: 52,  y: 157, r: -5,  s: 1.0 },
  { x: 76,  y: 159, r: 13,  s: 1.0 },
  { x: 100, y: 158, r: -8,  s: 1.0 },
  { x: 122, y: 159, r: 6,   s: 1.0 },
  // row 10
  { x: 14,  y: 174, r: 11,  s: 1.0 },
  { x: 38,  y: 175, r: -15, s: 1.0 },
  { x: 62,  y: 173, r: 5,   s: 1.0 },
  { x: 86,  y: 175, r: -9,  s: 1.0 },
  { x: 110, y: 174, r: 14,  s: 1.0 },
  // row 11
  { x: 4,   y: 190, r: -7,  s: 1.0 },
  { x: 28,  y: 191, r: 12,  s: 1.0 },
  { x: 52,  y: 189, r: -13, s: 1.0 },
  { x: 76,  y: 191, r: 7,   s: 1.0 },
  { x: 100, y: 190, r: -11, s: 1.0 },
  { x: 122, y: 191, r: 9,   s: 1.0 },
  // row 12 — top
  { x: 14,  y: 206, r: 14,  s: 1.0 },
  { x: 38,  y: 207, r: -6,  s: 1.0 },
  { x: 62,  y: 205, r: 10,  s: 1.0 },
  { x: 86,  y: 207, r: -14, s: 1.0 },
  { x: 110, y: 206, r: 5,   s: 1.0 },
]

const PRESTIGE_TIERS = [
  { name: 'Bronze',   min: 0   },
  { name: 'Silver',   min: 150 },
  { name: 'Gold',     min: 300 },
  { name: 'Platinum', min: 450 },
  { name: 'Diamond',  min: 600 },
  { name: 'Champion', min: 750 },
  { name: 'Legend',   min: 900 },
]

const getPrestige = (total) => {
  let tier = PRESTIGE_TIERS[0]
  for (const t of PRESTIGE_TIERS) {
    if (total >= t.min) tier = t
  }
  const nextTier = PRESTIGE_TIERS[PRESTIGE_TIERS.indexOf(tier) + 1]
  return {
    prestige: tier.name,
    prestigeNext: nextTier ? nextTier.min - total : 0,
    prestigeAtMax: !nextTier,
  }
}

const INITIAL_PERSONAL = 72 // 18+36+18

const ADMIN_PASSWORD = 'jewishgirls613'
const ZELLE_PHONE = '5187276037'

const CAUSES = [
  {
    id: 'general',
    name: 'Where Needed Most',
    emoji: '🕊️',
    desc: 'Support GROW — connecting Jewish women and girls to their roots, their community, and themselves since 1995.',
  },
  {
    id: 'greenbush',
    name: 'Jewish Greenbush Retreats Chabad',
    emoji: '🌿',
    desc: 'Jewish Greenbush Chabad brings families together year-round — Shabbat tables, outdoor adventures, community gatherings, retreats, and more. Your donation makes it all possible.',
  },
  {
    id: 'jgu',
    name: 'Jewish Girls Unite',
    emoji: '💫',
    desc: 'Empowering Jewish women and girls through events, retreats, and mentorship — helping every girl find her light and her place in the Jewish world.',
  },
]

// Keys that persist to localStorage
const PERSIST_KEYS = [
  'streak', 'totalPersonal', 'totalRaised', 'communityGoal', 'seenIntro',
  'donations', 'allDonations', 'pushkaGoal', 'pushkaBalance', 'pendingPayment', 'pileCoins',
  'autoPayEnabled', 'autoPayThreshold',
  'reminderEnabled', 'reminderTime', 'reminderFrequency',
  'recurringEnabled', 'recurringAmount', 'recurringFrequency',
  'lastRecurringDate', 'lastStreakDate', 'prestige', 'prestigeNext', 'prestigeAtMax',
]

const loadSaved = () => {
  try {
    const raw = localStorage.getItem('pushka_state')
    const saved = raw ? JSON.parse(raw) : {}
    // Cap balance at goal to prevent stale inflated values
    const goal = saved.pushkaGoal || 100
    if (saved.pushkaBalance > goal) {
      saved.pushkaBalance = goal
      saved.pileCoins = saved.pileCoins || []
    }
    return saved
  } catch { return {} }
}

const initialState = {
  screen: 'home',
  menuOpen: false,
  adminUnlocked: false,
  adminPassword: '',
  adminPasswordError: '',
  dbDonations: null,
  paymentMethod: 'card',
  donationCause: 'general',
  aboutOpen: false,
  allDonations: [],
  recurringDue: false,

  // Auth
  user: null,
  authEmail: '',
  authPassword: '',
  authName: '',
  authError: '',
  authLoading: false,

  // App data
  totalRaised: 0,
  communityGoal: 36000,
  pushkaBalance: 0,
  pushkaGoal: 100,
  streak: 0,
  totalPersonal: 0,
  ...getPrestige(0),
  donations: [],
  selectedAmount: 18,
  customAmount: '',
  showHomeCustom: false,
  pendingPayment: 0,
  donorName: '',
  lastDonation: 0,
  fallingCoins: [],
  pileCoins: [],
  isDropping: false,
  thankYouAmount: null,
  pushkaFull: false,
  checkoutLoading: false,
  checkoutError: '',
  paymentModalOpen: false,
  paymentClientSecret: null,
  paymentLoading: false,
  paymentError: '',

  // Settings
  autoPayEnabled: false,
  autoPayThreshold: 180,
  reminderEnabled: false,
  reminderTime: '09:00',
  reminderFrequency: 'daily',

  // Recurring payments
  recurringEnabled: false,
  recurringAmount: 18,
  recurringFrequency: 'weekly',
  lastRecurringDate: null,
  lastStreakDate: null,
  seenIntro: false,
}

// ── is a recurring payment due today? ──
const isRecurringDue = (frequency, lastDate) => {
  if (!lastDate) return true
  const last = new Date(lastDate)
  const now = new Date()
  const daysSince = Math.floor((now - last) / 86400000)
  if (frequency === 'weekly') return daysSince >= 7
  if (frequency === 'monthly') return daysSince >= 30
  if (frequency === 'shabbat') {
    // due if last was before the most recent Friday
    const day = now.getDay() // 0=Sun, 5=Fri, 6=Sat
    const daysSinceFriday = day === 5 ? 0 : day === 6 ? 1 : day + 2
    const lastFriday = new Date(now); lastFriday.setDate(now.getDate() - daysSinceFriday)
    lastFriday.setHours(0,0,0,0)
    return last < lastFriday
  }
  return false
}

export default function App() {
  const [s, setS] = useState(() => ({ ...initialState, ...loadSaved() }))
  const coinTimerRef = useRef(null)
  const audioCtxRef = useRef(null)
  const reminderTimerRef = useRef(null)
  const saveTimerRef = useRef(null)

  const set = (updates) => setS(prev => ({ ...prev, ...updates }))

  // ── SAVE to Supabase (debounced 2s) ──
  const saveToCloud = (state) => {
    if (!state.user) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      await supabase.from('user_data').upsert({
        user_id: state.user.id,
        streak: state.streak,
        last_streak_date: state.lastStreakDate,
        pushka_balance: state.pushkaBalance,
        pending_payment: state.pendingPayment,
        pile_coins: state.pileCoins,
        pushka_goal: state.pushkaGoal,
        total_personal: state.totalPersonal,
        donations: state.donations,
        auto_pay_enabled: state.autoPayEnabled,
        auto_pay_threshold: state.autoPayThreshold,
        reminder_enabled: state.reminderEnabled,
        reminder_time: state.reminderTime,
        reminder_frequency: state.reminderFrequency,
        recurring_enabled: state.recurringEnabled,
        recurring_amount: state.recurringAmount,
        recurring_frequency: state.recurringFrequency,
        last_recurring_date: state.lastRecurringDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }, 2000)
  }

  // ── LOAD from Supabase ──
  const loadFromCloud = async (user) => {
    const { data } = await supabase.from('user_data').select('*').eq('user_id', user.id).single()
    if (!data) return
    const loaded = {
      streak: data.streak ?? 0,
      lastStreakDate: data.last_streak_date,
      pushkaBalance: 0,
      pendingPayment: 0,
      pileCoins: [],
      pushkaGoal: 100,
      totalPersonal: Number(data.total_personal) || 0,
      donations: data.donations || [],
      autoPayEnabled: data.auto_pay_enabled || false,
      autoPayThreshold: data.auto_pay_threshold || 180,
      reminderEnabled: data.reminder_enabled || false,
      reminderTime: data.reminder_time || '09:00',
      reminderFrequency: data.reminder_frequency || 'daily',
      recurringEnabled: data.recurring_enabled || false,
      recurringAmount: data.recurring_amount || 18,
      recurringFrequency: data.recurring_frequency || 'weekly',
      lastRecurringDate: data.last_recurring_date,
      ...getPrestige(Number(data.total_personal) || 0),
    }
    // Also save to localStorage as cache
    localStorage.setItem('pushka_state', JSON.stringify(loaded))
    setS(prev => ({ ...prev, ...loaded }))
    // Check recurring
    if (loaded.recurringEnabled && isRecurringDue(loaded.recurringFrequency, loaded.lastRecurringDate)) {
      setS(prev => ({ ...prev, recurringDue: true }))
    }
  }

  // Persist to localStorage + cloud whenever key state changes
  useEffect(() => {
    const toSave = {}
    PERSIST_KEYS.forEach(k => { if (s[k] !== undefined) toSave[k] = s[k] })
    localStorage.setItem('pushka_state', JSON.stringify(toSave))
    saveToCloud(s)
  }, PERSIST_KEYS.map(k => s[k])) // eslint-disable-line react-hooks/exhaustive-deps

  // Check for due recurring payment on load (guest/no cloud)
  useEffect(() => {
    if (!s.user && s.recurringEnabled && isRecurringDue(s.recurringFrequency, s.lastRecurringDate)) {
      set({ recurringDue: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load real community total from Supabase ──
  useEffect(() => {
    const fetchTotal = async () => {
      const { data } = await supabase
        .from('donations')
        .select('amount')
      if (data) {
        const total = data.reduce((sum, d) => sum + Number(d.amount), 0)
        set({ totalRaised: total })
      }
    }
    fetchTotal()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Schedule browser notification for reminders
  useEffect(() => {
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current)
    if (!s.reminderEnabled) return

    const scheduleNotif = () => {
      const now = new Date()
      const [hh, mm] = s.reminderTime.split(':').map(Number)
      const target = new Date()
      target.setHours(hh, mm, 0, 0)
      if (target <= now) target.setDate(target.getDate() + 1)
      const delay = target - now

      reminderTimerRef.current = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('🪙 GROW Pushka', {
            body: 'Time to drop coins into your pushka! Every mitzvah counts.',
            icon: '/favicon.ico',
          })
        }
        // Re-schedule for next occurrence
        if (s.reminderFrequency === 'daily') scheduleNotif()
      }, delay)
    }

    if (Notification.permission === 'granted') {
      scheduleNotif()
    }
    return () => clearTimeout(reminderTimerRef.current)
  }, [s.reminderEnabled, s.reminderTime, s.reminderFrequency])

  // Check Supabase session on mount + handle OAuth redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        set({ user: session.user, screen: 'home' })
        loadFromCloud(session.user)
      } else if (event === 'SIGNED_OUT') {
        set({ user: null })
      }
    })

    const init = async () => {
      // Handle PKCE code in URL (Google OAuth redirect)
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        window.history.replaceState({}, '', '/')
        try {
          const { data } = await supabase.auth.exchangeCodeForSession(code)
          if (data?.session?.user) {
            set({ user: data.session.user, screen: 'home' })
            return
          }
        } catch (e) {}
      }
      // Check existing session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user, screen: 'home' })
        loadFromCloud(session.user)
      }
    }

    init()
    return () => subscription.unsubscribe()
  }, [])


  const formatCard = (t) => {
    const c = t.replace(/\D/g, '')
    return (c.match(/.{1,4}/g) || []).join(' ').slice(0, 19)
  }
  const formatExpiry = (t) => {
    const c = t.replace(/\D/g, '')
    return c.length >= 3 ? c.slice(0, 2) + '/' + c.slice(2, 4) : c
  }

  const getAmount = () => s.selectedAmount || parseFloat(s.customAmount) || 0
  const pct = (a, b) => Math.min(Math.round((a / b) * 100), 100)

  // ── AUTH ──
  const handleSignIn = async () => {
    set({ authLoading: true, authError: '' })
    const { error } = await supabase.auth.signInWithPassword({
      email: s.authEmail,
      password: s.authPassword,
    })
    if (error) {
      set({ authLoading: false, authError: error.message })
    } else {
      set({ authLoading: false, screen: 'home', authEmail: '', authPassword: '' })
    }
  }

  const handleSignUp = async () => {
    if (!s.authName.trim()) return set({ authError: 'Please enter your name' })
    if (!s.authEmail.trim()) return set({ authError: 'Please enter your email' })
    if (s.authPassword.length < 6) return set({ authError: 'Password must be at least 6 characters' })
    set({ authLoading: true, authError: '' })
    const { data, error } = await supabase.auth.signUp({
      email: s.authEmail,
      password: s.authPassword,
      options: {
        data: { full_name: s.authName },
        emailRedirectTo: 'https://grow-web-eta.vercel.app',
      },
    })
    if (error) {
      set({ authLoading: false, authError: error.message })
    } else if (data?.user && !data?.session) {
      // Email confirmation required
      set({ authLoading: false, screen: 'verify-email', authEmail: s.authEmail })
    } else {
      set({ authLoading: false, screen: 'home', authEmail: '', authPassword: '', authName: '' })
    }
  }

  const googleCallback = async ({ credential }) => {
    const { data } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })
    if (data?.session?.user) {
      set({ user: data.session.user, screen: 'home' })
    }
  }

  const renderGoogleButton = (elementId) => {
    const init = () => {
      window.google.accounts.id.initialize({
        client_id: '859653380969-p1e6js2mmof53l6btr23pj4b5pfql42t.apps.googleusercontent.com',
        callback: googleCallback,
      })
      const el = document.getElementById(elementId)
      if (el) {
        window.google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: el.offsetWidth || 320,
          text: 'continue_with',
        })
      }
    }
    if (window.google) { init() }
    else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = init
      document.head.appendChild(script)
    }
  }

  useEffect(() => {
    if (s.screen === 'signin') renderGoogleButton('google-btn-signin')
    if (s.screen === 'signup') renderGoogleButton('google-btn-signup')
    // Pre-fill checkout amount with pushka balance
    if (s.screen === 'checkout' && !s.customAmount && s.pushkaBalance > 0) {
      set({ customAmount: String(parseFloat(s.pushkaBalance.toFixed(2))) })
    }
  }, [s.screen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    set({ user: null, menuOpen: false })
  }

  // ── SOUND ──
  const getAudioCtx = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      return audioCtxRef.current
    } catch (e) { return null }
  }

  const playClink = (delay = 0) => {
    const ctx = getAudioCtx()
    if (!ctx) return
    setTimeout(() => {
      try {
        const t = ctx.currentTime
        const master = ctx.createGain()
        master.gain.value = 0.6
        master.connect(ctx.destination)

        // Metal impact noise burst
        const impactLen = Math.floor(ctx.sampleRate * 0.045)
        const impactBuf = ctx.createBuffer(1, impactLen, ctx.sampleRate)
        const impactData = impactBuf.getChannelData(0)
        for (let i = 0; i < impactLen; i++) {
          impactData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impactLen * 0.2))
        }
        const impactSrc = ctx.createBufferSource()
        impactSrc.buffer = impactBuf
        const impactFilter = ctx.createBiquadFilter()
        impactFilter.type = 'bandpass'
        impactFilter.frequency.value = 4500 + Math.random() * 2000
        impactFilter.Q.value = 2.0
        const impactGain = ctx.createGain()
        impactGain.gain.setValueAtTime(1.0, t)
        impactGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
        impactSrc.connect(impactFilter)
        impactFilter.connect(impactGain)
        impactGain.connect(master)
        impactSrc.start(t)

        // Coin ring tones
        const base = 1200 + Math.random() * 600
        ;[
          [1,    0.55],
          [2.76, 0.30],
          [5.4,  0.15],
          [8.93, 0.08],
        ].forEach(([ratio, amp]) => {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = base * ratio
          g.gain.setValueAtTime(amp, t + 0.002)
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.45 + Math.random() * 0.1)
          osc.connect(g)
          g.connect(master)
          osc.start(t)
          osc.stop(t + 0.6)
        })
      } catch (e) {}
    }, delay)
  }

  const visualCoinCount = (amount) => {
    if (amount <= 18)  return 3
    if (amount <= 36)  return 5
    if (amount <= 100) return 7
    return 9
  }

  // ── DROP COINS ──
  const dropCoins = (amount) => {
    if (!s.user) return set({ screen: 'signin' })
    if (s.isDropping) return
    const numCoins = visualCoinCount(amount)
    const coins = Array.from({ length: numCoins }, (_, i) => ({
      id: Date.now() + i,
      delay: i * 110,
      offset: (Math.random() - 0.5) * 20,
      dir: Math.random() > 0.5 ? 1 : -1,
    }))

    coins.forEach((_, i) => playClink(i * 110 + 620))

    const newBalance = s.pushkaBalance + amount
    const newPending = s.pendingPayment + amount
    const goalHit = newBalance >= s.pushkaGoal

    const newNumPile = Math.min(newBalance > 0 ? Math.max(1, Math.round((newBalance / s.pushkaGoal) * PILE_POSITIONS.length)) : 0, PILE_POSITIONS.length)
    const currentNumPile = s.pileCoins.length
    const extraPileCoins = []
    for (let i = currentNumPile; i < newNumPile; i++) {
      extraPileCoins.push({ id: `pile-${i}-${Date.now()}`, posIdx: i, isNew: true })
    }

    setS(prev => {
      const today = new Date().toDateString()
      const isNewDay = prev.lastStreakDate !== today
      return {
        ...prev,
        selectedAmount: amount,
        fallingCoins: coins,
        isDropping: true,
        pushkaBalance: newBalance,
        pendingPayment: newPending,
        pileCoins: [...prev.pileCoins, ...extraPileCoins],
        streak: isNewDay ? prev.streak + 1 : prev.streak,
        lastStreakDate: today,
        recurringDue: false,
        lastRecurringDate: new Date().toISOString(),
      }
    })

    if (coinTimerRef.current) clearTimeout(coinTimerRef.current)
    const duration = numCoins * 110 + 800
    coinTimerRef.current = setTimeout(() => {
      setS(prev => ({
        ...prev,
        fallingCoins: [],
        isDropping: false,
        thankYouAmount: amount,
        pileCoins: prev.pileCoins.map(c => ({ ...c, isNew: false })),
        screen: goalHit ? 'checkout' : prev.screen,
        pushkaFull: goalHit,
      }))
      setTimeout(() => setS(prev => ({ ...prev, thankYouAmount: null })), 2200)
    }, duration)
  }

  // ── RESET ── clears coins from pushka after payment
  const resetPushka = () => {
    setS(prev => {
      const paid = prev.pendingPayment
      const newBalance = Math.max(0, prev.pushkaBalance - paid)
      const newPersonal = prev.totalPersonal + paid

      // Remove coins proportional to amount paid
      const coinsToKeep = newBalance > 0 ? Math.max(1, Math.round((newBalance / prev.pushkaGoal) * PILE_POSITIONS.length)) : 0
      const newPileCoins = prev.pileCoins.slice(0, coinsToKeep)

      return {
        ...prev,
        pushkaBalance: newBalance,
        pendingPayment: 0,
        pushkaFull: false,
        pileCoins: newPileCoins,
        customAmount: '',
        donations: [{ date: 'Today', amount: paid, label: 'Donation', method: prev.paymentMethod }, ...prev.donations],
        allDonations: [{ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), amount: paid, label: 'Donation', method: prev.paymentMethod }, ...prev.allDonations],
        screen: 'success',
        lastDonation: paid,
        totalRaised: prev.totalRaised + paid,
        totalPersonal: newPersonal,
        ...getPrestige(newPersonal),
      }
    })
  }

  // ── CHECKOUT / PAYMENT ──
  const handleCheckout = async (overrideAmount) => {
    const amount = overrideAmount || s.pendingPayment || s.pushkaBalance
    if (!amount) return alert('Drop some coins first!')

    set({ checkoutLoading: true, checkoutError: '', pendingPayment: amount })
    try {
      const res = await fetch(
        `https://lscundsuxujnhsclgssx.supabase.co/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            userId: s.user?.id,
            userEmail: s.user?.email,
          }),
        }
      )
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      set({ checkoutLoading: false, paymentClientSecret: data.clientSecret, paymentModalOpen: true, paymentError: '' })
    } catch (err) {
      set({ checkoutLoading: false, checkoutError: err.message })
    }
  }

  const saveDonation = async (amount, method) => {
    await supabase.from('donations').insert({
      amount,
      method,
      cause: s.donationCause,
      user_id: s.user?.id || null,
      user_email: s.user?.email || null,
      label: CAUSES.find(c => c.id === s.donationCause)?.name || 'Donation',
    })
  }

  const handlePaySuccess = () => {
    set({ paymentModalOpen: false, paymentClientSecret: null, customAmount: '' })
    saveDonation(s.pendingPayment, 'card')
    resetPushka()
  }

  // ── MENU ──
  const Menu = () => (
    <div className={`menu-overlay ${s.menuOpen ? 'open' : ''}`} onClick={() => set({ menuOpen: false })}>
      <div className="menu-panel" onClick={e => e.stopPropagation()}>
        <div className="menu-header">
          <div className="menu-avatar">{s.user ? '👤' : '🪙'}</div>
          <div>
            <div className="menu-app-name">GROW Pushka</div>
            <div className="menu-mode">
              {s.user ? (s.user.user_metadata?.full_name || s.user.email) : 'Guest Mode'}
            </div>
          </div>
          <button className="menu-close" onClick={() => set({ menuOpen: false })}>✕</button>
        </div>
        {[
          { icon: '🪙', label: 'My Pushka', screen: 'home' },
          { icon: '💳', label: 'Pay Now', screen: 'checkout' },
          { icon: '🕐', label: 'History', screen: 'history' },
          { icon: '⚙️', label: 'Settings', screen: 'settings' },
          ...(s.user?.email === 'adlaber@gmail.com' ? [{ icon: '🛡️', label: 'Admin', screen: 'admin' }] : []),
        ].map(item => (
          <button key={item.label} className="menu-item" onClick={() => set({ screen: item.screen, menuOpen: false })}>
            <span className="menu-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="menu-divider" />
        {s.user ? (
          <button className="menu-item menu-signout" onClick={handleSignOut}>
            <span className="menu-item-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        ) : (
          <button className="menu-item menu-signin-item" onClick={() => set({ screen: 'signin', menuOpen: false })}>
            <span className="menu-item-icon">✨</span>
            <span>Sign In / Sign Up</span>
          </button>
        )}
      </div>
    </div>
  )

  // ── TOP NAV ──
  const Nav = ({ title }) => (
    <div className="nav">
      <button className="nav-btn" onClick={() => set({ menuOpen: true })}>
        <span className="hamburger">☰</span> MENU
      </button>
      <div className="nav-title">{title}</div>
      <div className="nav-right">
        <div className={`rank-chip rank-chip--${(s.prestige || 'bronze').toLowerCase()}`}>{s.prestige || 'Bronze'}</div>
        <div className="streak-badge">
          <span className="streak-num">{s.streak}</span> STREAK
        </div>
        <button className="nav-btn share-btn" onClick={async () => {
          try {
            await navigator.share({ title: 'GROW Pushka', url: window.location.href })
          } catch {
            await navigator.clipboard.writeText(window.location.href).catch(() => {})
          }
        }}>⬆</button>
      </div>
    </div>
  )

  // ── BOTTOM NAV ──
  const BottomNav = () => (
    <div className="bottom-nav">
      <button className={`bottom-nav-item ${s.screen === 'home' ? 'active' : ''}`} onClick={() => set({ screen: 'home' })}>
        <span className="bottom-nav-icon">🪙</span>
        <span className="bottom-nav-label">Pushka</span>
      </button>
      <button className={`bottom-nav-item ${s.screen === 'checkout' ? 'active' : ''}`} onClick={() => set({ screen: 'checkout' })}>
        <span className="bottom-nav-icon">💳</span>
        <span className="bottom-nav-label">Pay</span>
      </button>
      <button className={`bottom-nav-item ${s.screen === 'history' ? 'active' : ''}`} onClick={() => set({ screen: 'history' })}>
        <span className="bottom-nav-icon">🕐</span>
        <span className="bottom-nav-label">History</span>
      </button>
      {s.user ? (
        <button className={`bottom-nav-item ${s.screen === 'settings' ? 'active' : ''}`} onClick={() => set({ screen: 'settings' })}>
          <span className="bottom-nav-icon">⚙️</span>
          <span className="bottom-nav-label">Settings</span>
        </button>
      ) : (
        <button className={`bottom-nav-item ${s.screen === 'signin' ? 'active' : ''}`} onClick={() => set({ screen: 'signin' })}>
          <span className="bottom-nav-icon">✨</span>
          <span className="bottom-nav-label">Sign In</span>
        </button>
      )}
    </div>
  )

  // ── PAYMENT MODAL ──
  const paymentModal = s.paymentModalOpen && s.paymentClientSecret ? (
    <div className="payment-modal-overlay" onClick={() => set({ paymentModalOpen: false })}>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: s.paymentClientSecret,
          appearance: {
            theme: 'night',
            variables: {
              colorPrimary: '#C8922A',
              colorBackground: '#1a1008',
              colorText: '#F5EDD8',
              colorDanger: '#ff6b6b',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '12px',
            },
          },
        }}
      >
        <PaymentForm
          amount={s.pendingPayment}
          onSuccess={handlePaySuccess}
          onClose={() => set({ paymentModalOpen: false })}
        />
      </Elements>
    </div>
  ) : null

  // ── COMBINED AUTH SCREEN ──
  if (s.screen === 'signin' || s.screen === 'signup') {
    const isNew = s.screen === 'signup'
    return (
      <div className="app forest-bg">
        <div className="auth-screen">

          {/* Branding */}
          <div className="auth-logo">
            <div className="auth-logo-icon">צ</div>
            <div className="auth-app-name">GROW Pushka</div>
          </div>
          <p className="auth-tagline">Your digital tzedakah box 🪙</p>
          <div className="auth-howit">
            Drop coins · Fill your pushka · Donate to Jewish Greenbush Chabad
          </div>

          {s.authError && <div className="auth-error">{s.authError}</div>}

          {/* Google — primary CTA */}
          <div id={isNew ? 'google-btn-signup' : 'google-btn-signin'} className="google-btn-container" />

          <div className="auth-or"><span>or</span></div>

          {/* Email form */}
          <div className="auth-form">
            {isNew && (
              <input
                className="field-input auth-input"
                placeholder="Your name"
                value={s.authName}
                onChange={e => set({ authName: e.target.value })}
              />
            )}
            <input
              className="field-input auth-input"
              placeholder="Email address"
              type="email"
              value={s.authEmail}
              onChange={e => set({ authEmail: e.target.value })}
            />
            <input
              className="field-input auth-input"
              placeholder={isNew ? 'Create a password (min 6 chars)' : 'Password'}
              type="password"
              value={s.authPassword}
              onChange={e => set({ authPassword: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && (isNew ? handleSignUp() : handleSignIn())}
            />
            <button className="cta-btn auth-btn" onClick={isNew ? handleSignUp : handleSignIn} disabled={s.authLoading}>
              {s.authLoading ? '...' : isNew ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <button className="auth-switch" onClick={() => set({ screen: isNew ? 'signin' : 'signup', authError: '' })}>
            {isNew ? 'Already have an account?' : 'New here?'} <span>{isNew ? 'Sign in' : 'Create account'}</span>
          </button>
          <button className="auth-guest" onClick={() => set({ screen: 'home' })}>
            Browse without account →
          </button>
        </div>
      </div>
    )
  }

  // ── VERIFY EMAIL SCREEN ──
  if (s.screen === 'verify-email') return (
    <div className="app forest-bg">
      <div className="auth-screen">
        <div className="auth-logo">
          <div className="auth-logo-icon">✉️</div>
          <div className="auth-app-name">GROW Pushka</div>
        </div>
        <h1 className="auth-title">Check Your Email</h1>
        <p className="auth-sub">We sent a confirmation link to</p>
        <div style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: 15, marginBottom: 24, textAlign: 'center' }}>
          {s.authEmail}
        </div>
        <div className="glass-card" style={{ width: '100%', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
          <p style={{ color: 'var(--cream)', fontSize: 14, lineHeight: 1.7 }}>
            Click the link in your email to verify your account, then come back here and sign in.
          </p>
        </div>
        <button className="cta-btn" style={{ width: '100%', marginBottom: 14 }}
          onClick={() => set({ screen: 'signin', authError: '' })}>
          Go to Sign In
        </button>
        <button className="auth-switch" onClick={async () => {
          await supabase.auth.resend({ type: 'signup', email: s.authEmail })
          alert('Verification email resent!')
        }}>
          Didn't get it? <span>Resend email</span>
        </button>
      </div>
    </div>
  )

  // ── SUCCESS SCREEN ──
  if (s.screen === 'success') return (
    <div className="app forest-bg">
      <Menu />
      <Nav title="My Pushka" />
      <div className="success-screen">
        <div className="success-glow">✨</div>
        <h1 className="success-title">Thank You!</h1>
        <p className="success-sub">Your ${s.lastDonation} donation was received</p>
        <p className="success-msg">You've just added light to the world. Your contribution to the GROW Pushka makes a real difference.</p>
        <div className="glass-card impact-card">
          <div className="stat-label">🕍 CHABAD OF EAST GREENBUSH</div>
          <div className="stat-big">${s.totalRaised.toLocaleString()} <span className="stat-muted">/ ${s.communityGoal.toLocaleString()}</span></div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: pct(s.totalRaised, s.communityGoal) + '%' }} /></div>
        </div>
        <div className="streak-card">
          <div className="streak-circle">{s.streak}</div>
          <div>
            <div className="streak-title">DAY STREAK</div>
            <div className="streak-sub">KEEP THE MITZVAH GOING!</div>
          </div>
        </div>
        <button className="cta-btn" onClick={() => set({ screen: 'home' })}>
          Back to Pushka
        </button>
      </div>
    </div>
  )

  // ── HISTORY SCREEN ──
  if (s.screen === 'history') return (
    <div className="app forest-bg">
      <Menu />
      <Nav title="History" />
      <div className="page-content">
        <div className="glass-card">
          <div className="card-title">Donation History</div>
          {s.donations.length === 0 ? (
            <p style={{ color: 'var(--cream)', opacity: 0.6, textAlign: 'center', padding: '16px 0' }}>No donations yet</p>
          ) : s.donations.map((d, i) => (
            <div key={i} className="history-row">
              <div>
                <div className="history-label">{d.label}</div>
                <div className="history-date">{d.date}</div>
              </div>
              <div className="history-amount">${d.amount}</div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )

  // ── CHECKOUT SCREEN ──
  if (s.screen === 'checkout') return (
    <div className="app forest-bg">
      {paymentModal}
      <Menu />
      <Nav title="Donate" />
      <div className="page-content">
        <button className="back-link" onClick={() => set({ screen: 'home' })}>← Back</button>

        {s.pushkaFull && (
          <div className="full-banner">
            🎉 Your pushka is full with ${s.pushkaBalance.toFixed(2)}! Time to donate.
          </div>
        )}

        {/* Custom amount input */}
        <div className="glass-card pending-card">
          <div className="stat-label">ENTER AMOUNT</div>
          <div className="custom-amount-row">
            <span className="custom-dollar">$</span>
            <input
              className="custom-amount-input"
              type="number"
              min="1"
              placeholder="0"
              value={s.customAmount}
              onChange={e => set({ customAmount: e.target.value })}
            />
          </div>
          <div className="quick-amounts">
            {[18, 36, 54, 100].map(amt => (
              <button key={amt} className="quick-amt-btn" onClick={() => set({ customAmount: String(amt) })}>${amt}</button>
            ))}
          </div>
        </div>

        {/* Choose cause — compact pills */}
        <div className="cause-label">Where should your donation go?</div>
        <div className="cause-pills">
          {CAUSES.map(c => (
            <button
              key={c.id}
              className={`cause-pill ${s.donationCause === c.id ? 'active' : ''}`}
              onClick={() => set({ donationCause: c.id })}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        {/* Zelle tip */}
        <div className="zelle-tip">
          💚 <strong>Tip:</strong> Paying with Zelle means 100% of your donation goes directly to Chabad of East Greenbush — no fees taken out. Every dollar makes a difference!
        </div>

        {/* Payment method tabs */}
        <div className="payment-tabs">
          <button
            className={`payment-tab ${s.paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => set({ paymentMethod: 'card' })}
          >💳 Card / Apple Pay</button>
          <button
            className={`payment-tab ${s.paymentMethod === 'zelle' ? 'active' : ''}`}
            onClick={() => set({ paymentMethod: 'zelle' })}
          >🏦 Zelle</button>
        </div>

        {s.paymentMethod === 'card' ? (
          <>
            {s.checkoutError && <div className="auth-error">{s.checkoutError}</div>}
            <button
              className="quick-give-btn pay-now-btn"
              onClick={() => {
                const amt = parseFloat(s.customAmount)
                if (!amt || amt < 1) return alert('Enter an amount to donate')
                set({ pendingPayment: amt })
                handleCheckout(amt)
              }}
              disabled={s.checkoutLoading}
            >
              {s.checkoutLoading ? 'Opening payment...' : `DONATE${s.customAmount ? ` $${parseFloat(s.customAmount).toFixed(2)}` : ''} →`}
            </button>
            <div className="stripe-badge">
              <span>🔒 Powered by</span>
              <span className="stripe-word">Stripe</span>
            </div>
          </>
        ) : (
          <div className="zelle-card glass-card">
            <div className="zelle-logo">💚 Zelle</div>
            <p className="zelle-instruction">Send your donation to:</p>
            <div className="zelle-phone">{ZELLE_PHONE}</div>
            <a
              href={`zelle://send?receiver_tel=${ZELLE_PHONE}`}
              className="zelle-open-btn"
              onClick={e => {
                // Try deep link; if it fails just show the number
                setTimeout(() => {}, 1000)
              }}
            >
              Open Zelle App →
            </a>
            <p className="zelle-note">Or open your banking app → Zelle → send to the number above</p>
            {s.customAmount && parseFloat(s.customAmount) > 0 && (
              <div className="zelle-amount-remind">Amount: <strong>${parseFloat(s.customAmount).toFixed(2)}</strong></div>
            )}
            <button
              className="quick-give-btn pay-now-btn"
              style={{ marginTop: 16 }}
              onClick={() => {
                const amt = parseFloat(s.customAmount)
                if (!amt || amt < 1) return alert('Enter an amount above')
                set({ pendingPayment: amt })
                saveDonation(amt, 'zelle')
                resetPushka()
              }}
            >
              I SENT IT ✓
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ── SETTINGS SCREEN ──
  if (s.screen === 'settings') return (
    <div className="app forest-bg">
      <Menu />
      <Nav title="Settings" />
      <div className="page-content">

        {/* Account */}
        <div className="glass-card settings-card">
          <div className="settings-section-title">👤 Account</div>
          {s.user ? (
            <>
              <div className="setting-row">
                <div>
                  <div className="setting-label">{s.user.user_metadata?.full_name || 'My Account'}</div>
                  <div className="setting-sub">{s.user.email}</div>
                </div>
              </div>
              <button className="settings-chip signout-chip" onClick={handleSignOut} style={{ marginTop: 14 }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <p className="settings-desc">Sign in to save your donations and enable automatic payments.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="settings-chip active" onClick={() => set({ screen: 'signin' })}>Sign In</button>
                <button className="settings-chip" onClick={() => set({ screen: 'signup' })}>Create Account</button>
              </div>
            </>
          )}
        </div>

        {/* Recurring Payments */}
        <div className="glass-card settings-card">
          <div className="settings-section-title">🔄 Recurring Donations</div>
          <p className="settings-desc">Automatically donate on a schedule — set it and forget it.</p>

          <div className="setting-row">
            <div>
              <div className="setting-label">Enable recurring</div>
              <div className="setting-sub">Auto-donate on a schedule</div>
            </div>
            <button
              className={`toggle ${s.recurringEnabled ? 'on' : ''}`}
              onClick={() => set({ recurringEnabled: !s.recurringEnabled })}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          {s.recurringEnabled && (
            <>
              <div className="setting-row" style={{ marginTop: 16 }}>
                <div className="setting-label">Amount</div>
                <div className="settings-amount-row">
                  {[18, 36, 54, 72].map(amt => (
                    <button
                      key={amt}
                      className={`settings-chip ${s.recurringAmount === amt ? 'active' : ''}`}
                      onClick={() => set({ recurringAmount: amt })}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row" style={{ marginTop: 14 }}>
                <div className="setting-label">Frequency</div>
                <div className="settings-amount-row">
                  {['weekly', 'monthly', 'shabbat'].map(f => (
                    <button
                      key={f}
                      className={`settings-chip ${s.recurringFrequency === f ? 'active' : ''}`}
                      onClick={() => set({ recurringFrequency: f })}
                    >
                      {f === 'shabbat' ? 'Erev Shabbat' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-notice">
                ✅ ${s.recurringAmount} will be added to your pushka {s.recurringFrequency === 'weekly' ? 'every week' : s.recurringFrequency === 'monthly' ? 'every month' : 'every Erev Shabbat'} — we'll remind you when it's due
                {!s.user && ' (sign in to save this setting)'}
              </div>
            </>
          )}
        </div>

        {/* Auto Payments */}
        <div className="glass-card settings-card">
          <div className="settings-section-title">💳 Auto-Pay When Full</div>
          <p className="settings-desc">Automatically charge your card when the pushka reaches its goal.</p>

          <div className="setting-row">
            <div>
              <div className="setting-label">Auto-Pay when full</div>
              <div className="setting-sub">Charge card when pushka hits ${s.autoPayThreshold}</div>
            </div>
            <button
              className={`toggle ${s.autoPayEnabled ? 'on' : ''}`}
              onClick={() => set({ autoPayEnabled: !s.autoPayEnabled })}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          {s.autoPayEnabled && (
            <div className="setting-row" style={{ marginTop: 16 }}>
              <div className="setting-label">Trigger amount</div>
              <div className="settings-amount-row">
                {[90, 180, 360, 500].map(amt => (
                  <button
                    key={amt}
                    className={`settings-chip ${s.autoPayThreshold === amt ? 'active' : ''}`}
                    onClick={() => set({ autoPayThreshold: amt })}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {s.autoPayEnabled && (
            <div className="settings-notice">
              ✓ Card charged automatically when balance hits ${s.autoPayThreshold}
            </div>
          )}
        </div>

        {/* Reminders */}
        <div className="glass-card settings-card">
          <div className="settings-section-title">🔔 Reminders</div>
          <p className="settings-desc">Get reminded to drop coins into your pushka.</p>

          <div className="setting-row">
            <div>
              <div className="setting-label">Daily reminders</div>
              <div className="setting-sub">Notify me to give tzedakah</div>
            </div>
            <button
              className={`toggle ${s.reminderEnabled ? 'on' : ''}`}
              onClick={async () => {
                if (!s.reminderEnabled) {
                  const perm = await Notification.requestPermission()
                  if (perm !== 'granted') {
                    return alert('Please allow notifications in your browser settings to enable reminders.')
                  }
                }
                set({ reminderEnabled: !s.reminderEnabled })
              }}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          {s.reminderEnabled && (
            <>
              <div className="setting-row" style={{ marginTop: 16 }}>
                <div className="setting-label">Reminder time</div>
                <input
                  type="time"
                  className="time-input"
                  value={s.reminderTime}
                  onChange={e => set({ reminderTime: e.target.value })}
                />
              </div>

              <div className="setting-row" style={{ marginTop: 14 }}>
                <div className="setting-label">Frequency</div>
                <div className="settings-amount-row">
                  {['daily', 'weekly', 'shabbat'].map(f => (
                    <button
                      key={f}
                      className={`settings-chip ${s.reminderFrequency === f ? 'active' : ''}`}
                      onClick={() => set({ reminderFrequency: f })}
                    >
                      {f === 'shabbat' ? 'Erev Shabbat' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-notice">
                ✓ You'll be reminded {s.reminderFrequency === 'daily' ? 'every day' : s.reminderFrequency === 'weekly' ? 'every week' : 'every Erev Shabbat'} at {s.reminderTime}
              </div>
            </>
          )}
        </div>

        {/* Pushka Goal */}
        <div className="glass-card settings-card">
          <div className="settings-section-title">🎯 Pushka Goal</div>
          <p className="settings-desc">Set your personal target for this pushka.</p>
          <div className="setting-row" style={{ marginTop: 8 }}>
            <div className="setting-label">Goal amount</div>
            <div className="settings-amount-row">
              {[90, 180, 360, 500, 1000].map(amt => (
                <button
                  key={amt}
                  className={`settings-chip ${s.pushkaGoal === amt ? 'active' : ''}`}
                  onClick={() => set({ pushkaGoal: amt })}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )

  // ── ADMIN SCREEN ──
  if (s.screen === 'admin' && s.user?.email !== 'adlaber@gmail.com') {
    return <div className="app forest-bg"><Menu /><Nav title="Admin" /><div className="page-content"><div className="glass-card" style={{textAlign:'center',padding:32}}><div style={{fontSize:48}}>🔒</div><div className="card-title" style={{marginTop:12}}>Access Denied</div></div></div></div>
  }
  if (s.screen === 'admin') {
    if (s.adminUnlocked && !s.dbDonations) {
      supabase.from('donations').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        set({ dbDonations: data || [] })
      })
    }

    if (!s.adminUnlocked) return (
      <div className="app forest-bg">
        <Menu />
        <Nav title="Admin" />
        <div className="page-content">
          <div className="glass-card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
            <div className="card-title">Admin Access</div>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Enter your admin password</p>
            {s.adminPasswordError && <div className="auth-error" style={{ marginBottom: 12 }}>{s.adminPasswordError}</div>}
            <input
              className="field-input auth-input"
              type="password"
              placeholder="Password"
              value={s.adminPassword}
              onChange={e => set({ adminPassword: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (s.adminPassword === ADMIN_PASSWORD) set({ adminUnlocked: true, adminPasswordError: '' })
                  else set({ adminPasswordError: 'Wrong password' })
                }
              }}
            />
            <button className="cta-btn" style={{ marginTop: 12, width: '100%' }} onClick={() => {
              if (s.adminPassword === ADMIN_PASSWORD) set({ adminUnlocked: true, adminPasswordError: '' })
              else set({ adminPasswordError: 'Wrong password' })
            }}>Unlock</button>
          </div>
        </div>
      </div>
    )

    const donations = s.dbDonations || []
    const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0)
    const cardDonations = donations.filter(d => d.method === 'card')
    const zelleDonations = donations.filter(d => d.method === 'zelle')

    return (
      <div className="app forest-bg">
        <Menu />
        <Nav title="Admin" />
        <div className="page-content">

          {/* Stats */}
          <div className="admin-stats-grid">
            <div className="glass-card admin-stat">
              <div className="stat-label">TOTAL COLLECTED</div>
              <div className="stat-big">${totalDonations.toLocaleString()}</div>
            </div>
            <div className="glass-card admin-stat">
              <div className="stat-label">DONATIONS</div>
              <div className="stat-big">{s.allDonations.length}</div>
            </div>
            <div className="glass-card admin-stat">
              <div className="stat-label">CARD</div>
              <div className="stat-big">{cardDonations.length}</div>
            </div>
            <div className="glass-card admin-stat">
              <div className="stat-label">ZELLE</div>
              <div className="stat-big">{zelleDonations.length}</div>
            </div>
          </div>

          {/* Edit community goal */}
          <div className="glass-card settings-card">
            <div className="settings-section-title">🎯 Community Goal</div>
            <div className="setting-row">
              <span className="setting-label">Current Goal</span>
              <input
                className="field-input"
                type="number"
                style={{ width: 120, textAlign: 'right' }}
                value={s.communityGoal}
                onChange={e => set({ communityGoal: parseFloat(e.target.value) || s.communityGoal })}
              />
            </div>
            <div className="setting-row">
              <span className="setting-label">Total Raised</span>
              <input
                className="field-input"
                type="number"
                style={{ width: 120, textAlign: 'right' }}
                value={s.totalRaised}
                onChange={e => set({ totalRaised: parseFloat(e.target.value) || s.totalRaised })}
              />
            </div>
          </div>

          {/* External links */}
          <div className="glass-card settings-card">
            <div className="settings-section-title">🔗 Dashboards</div>
            {[
              { label: 'Stripe — View Payments', url: 'https://dashboard.stripe.com' },
              { label: 'Supabase — View Users', url: 'https://supabase.com/dashboard/project/lscundsuxujnhsclgssx' },
              { label: 'Vercel — Deployment', url: 'https://vercel.com/nechamalaber-rgbs-projects/grow-web' },
            ].map(({ label, url }) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="admin-link">
                {label} →
              </a>
            ))}
          </div>

          {/* Donation log */}
          <div className="glass-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              All Donations
              <button style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => set({ dbDonations: null })}>↻ Refresh</button>
            </div>
            {!s.dbDonations && <p style={{ color: 'var(--muted)', padding: '12px 0' }}>Loading...</p>}
            {donations.length === 0 && s.dbDonations && <p style={{ color: 'var(--muted)', padding: '12px 0' }}>No donations yet</p>}
            {donations.map((d, i) => (
              <div key={i} className="history-row">
                <div>
                  <div className="history-label">{d.label} <span style={{ color: d.method === 'zelle' ? '#4ade80' : 'var(--gold)', fontSize: 11 }}>({d.method})</span></div>
                  <div className="history-date">{d.user_email || 'Guest'} · {new Date(d.created_at).toLocaleDateString()}</div>
                </div>
                <div className="history-amount">${Number(d.amount).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <button className="settings-chip signout-chip" onClick={() => set({ adminUnlocked: false, adminPassword: '', screen: 'home' })} style={{ width: '100%', marginTop: 8 }}>
            Lock Admin
          </button>
        </div>
      </div>
    )
  }

  // ── HOME SCREEN ──
  return (
    <div className="app forest-bg">
      {paymentModal}
      <Menu />
      <Nav title="My Pushka" />

      {/* ── INTRO OVERLAY (first time only) ── */}
      {!s.seenIntro && (
        <div className="intro-overlay">
          <div className="intro-box">
            <div className="intro-pushka-icon">
              <div className="intro-mini-pushka">
                <div className="imp-lid"><div className="imp-slot"></div></div>
                <div className="imp-body"><span>צ</span></div>
              </div>
            </div>
            <div className="intro-title">Jewish Greenbush Chabad</div>
            <div className="intro-tagline">Tzedakah, one coin at a time</div>
            <p className="intro-desc">
              Chabad of East Greenbush brings Jewish families together — Shabbos tables, holidays, youth programs, and more.
              This pushka helps make it all happen.
            </p>
            <div className="intro-what-we-do">
              <div className="intro-activity">✡️ Shabbos & holiday celebrations</div>
              <div className="intro-activity">👧 GROW girls programs & retreats</div>
              <div className="intro-activity">🏡 Community events & family programs</div>
              <div className="intro-activity">📖 Torah classes & Jewish education</div>
            </div>
            <div className="intro-steps">
              <div className="intro-step">
                <div className="intro-step-icon">🪙</div>
                <div>
                  <div className="intro-step-title">Drop coins</div>
                  <div className="intro-step-sub">Tap any amount to add to your pushka</div>
                </div>
              </div>
              <div className="intro-step">
                <div className="intro-step-icon">💛</div>
                <div>
                  <div className="intro-step-title">Fill it &amp; donate</div>
                  <div className="intro-step-sub">Pay when ready — 100% goes to Chabad</div>
                </div>
              </div>
            </div>
            <button className="intro-btn" onClick={() => set({ seenIntro: true })}>
              Start Giving →
            </button>
            <button className="intro-skip" onClick={() => set({ seenIntro: true })}>
              Skip
            </button>
          </div>
        </div>
      )}

      <div className="page-content">

        {/* Recurring payment due banner */}
        {s.recurringDue && s.recurringEnabled && (
          <div className="recurring-banner">
            <div className="recurring-banner-text">
              🔄 Your {s.recurringFrequency === 'shabbat' ? 'Erev Shabbat' : s.recurringFrequency} donation of <strong>${s.recurringAmount}</strong> is ready!
            </div>
            <div className="recurring-banner-btns">
              <button className="recurring-yes" onClick={() => {
                set({ recurringDue: false })
                dropCoins(s.recurringAmount)
              }}>Drop Coins ✓</button>
              <button className="recurring-skip" onClick={() => set({ recurringDue: false, lastRecurringDate: new Date().toISOString() })}>Skip</button>
            </div>
          </div>
        )}

        {/* Community goal — slim strip */}
        <div className="goal-strip">
          <div className="goal-strip-top">
            <span className="goal-strip-label">🕍 Community Goal</span>
            <span className="goal-strip-nums">${s.totalRaised.toLocaleString()} <span className="goal-strip-of">/ ${s.communityGoal.toLocaleString()}</span></span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: pct(s.totalRaised, s.communityGoal) + '%' }} /></div>
        </div>

        {/* What We Do photo strip — above pushka */}
        <PhotoStrip />

        {/* ── PUSHKA VISUAL ── */}
        <div className="pushka-section">
          <div className="pushka-side left"><span>TARGET: ${s.pushkaGoal}</span></div>
          <div className="pushka-wrapper">

            {/* Falling coins */}
            {s.fallingCoins.map(coin => (
              <div
                key={coin.id}
                className="falling-coin"
                style={{
                  animationDelay: `${coin.delay}ms`,
                  left: `calc(50% + ${coin.offset}px)`,
                  '--dir': coin.dir,
                }}
              >
                <span className="falling-coin-label">צ</span>
              </div>
            ))}

            <div className="pushka-container">
              <div className="pushka-slot-wrap">
                <div className="pushka-slot-base">
                  <div className="pushka-slot-hole" />
                </div>
              </div>

              <div className="pushka-body">
                <div className="pushka-inner">
                  <div className="pushka-hebrew">צדקה</div>
                  <div className="pushka-sub">TZEDAKA</div>
                </div>

                {/* Coin pile */}
                <div className="pushka-pile">
                  <div className="pile-sand" style={{ height: `${Math.max(35, Math.round((Math.min(s.pushkaBalance, s.pushkaGoal) / s.pushkaGoal) * 220))}px` }} />
                  {s.pileCoins.map(coin => (
                    <div
                      key={coin.id}
                      className="pile-coin-3d"
                      style={{
                        left: `${PILE_POSITIONS[coin.posIdx].x}px`,
                        bottom: `${PILE_POSITIONS[coin.posIdx].y}px`,
                        transform: `rotate(${PILE_POSITIONS[coin.posIdx].r}deg) scale(${PILE_POSITIONS[coin.posIdx].s})`,
                        zIndex: Math.floor(PILE_POSITIONS[coin.posIdx].y / 15) + 1,
                        animation: coin.isNew ? undefined : 'none',
                      }}
                    />
                  ))}
                  {s.pileCoins.length > 0 && (
                    <div className="pushka-org-pile">JEWISH GREENBUSH CHABAD</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="pushka-side right"><span>CURRENT: ${Math.min(s.pushkaBalance, s.pushkaGoal).toFixed(2)}</span></div>
        </div>

        {/* Thank you toast */}
        {s.thankYouAmount && (
          <div className="tysm-toast">
            <div className="tysm-emoji">✨</div>
            <div className="tysm-text">Thank you so much!</div>
            <div className="tysm-sub">${s.thankYouAmount} dropped in — you're amazing 🪙</div>
          </div>
        )}

        <div className="fillup-title">Fill it up!</div>
        <div className="fillup-sub">JEWISH GREENBUSH CHABAD</div>

        {/* Slim pushka status */}
        <div className="pushka-status-strip">
          <div className="pushka-status-row">
            <span className="pushka-status-bal">${Math.min(s.pushkaBalance, s.pushkaGoal).toFixed(2)} <span className="pushka-status-of">/ ${s.pushkaGoal}</span></span>
            <span className="pushka-status-pct gold">{pct(s.pushkaBalance, s.pushkaGoal)}% Full</span>
          </div>
          <div className="progress-bar"><div className="progress-fill gold" style={{ width: pct(s.pushkaBalance, s.pushkaGoal) + '%' }} /></div>
          {s.pendingPayment > 0 && (
            <div className="pending-chip">
              🪙 ${s.pendingPayment.toFixed(2)} ready to pay — <span onClick={() => set({ screen: 'checkout' })}>Pay Now</span>
            </div>
          )}
        </div>


        {/* Amount Selection */}
        <div className="select-label-row">
          <span className="select-label">Choose an amount</span>
          <span className="custom-link" onClick={() => s.user ? set({ showHomeCustom: !s.showHomeCustom }) : set({ screen: 'signin' })}>Custom $</span>
        </div>
        {s.user && s.showHomeCustom && (
          <div className="home-custom-row">
            <span className="custom-dollar">$</span>
            <input
              className="custom-amount-input"
              type="number"
              min="1"
              placeholder="0"
              value={s.customAmount}
              onChange={e => set({ customAmount: e.target.value })}
              autoFocus
            />
            <button
              className="home-custom-btn"
              onClick={() => {
                const amt = parseFloat(s.customAmount)
                if (!amt || amt < 1) return
                set({ customAmount: '', showHomeCustom: false })
                dropCoins(amt)
              }}
            >Add 🪙</button>
          </div>
        )}
        {!s.user && (
          <button className="signin-prompt" onClick={() => set({ screen: 'signin' })}>
            <span>Sign in to drop coins into your pushka</span>
            <span className="signin-prompt-arrow">→</span>
          </button>
        )}
        <div className="amount-grid home-amounts">
          {(() => {
            const opts = [
              { amount: 10, label: 'Gift', hebrew: '+$10' },
              { amount: 18, label: 'Chai ✡️', hebrew: '+$18' },
              { amount: 36, label: 'Double', hebrew: '+$36' },
            ]
            return opts.map(opt => (
              <button
                key={opt.amount}
                className={`amount-card ${s.selectedAmount === opt.amount ? 'selected' : ''} ${s.isDropping ? 'dropping' : ''} ${!s.user ? 'locked' : ''}`}
                onClick={() => s.user ? dropCoins(opt.amount) : set({ screen: 'signin' })}
              >
                <div className="amount-value">${opt.amount}</div>
                <div className="amount-add">{opt.hebrew}</div>
                <div className="amount-label">{opt.label}</div>
              </button>
            ))
          })()}
        </div>

        {/* Pay Now CTA */}
        {s.pendingPayment > 0 && (
          <button className="quick-give-btn pay-now-btn" onClick={() => set({ screen: 'checkout' })}>
            🪙 Donate ${s.pendingPayment.toFixed(2)} to Jewish Greenbush Chabad →
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
