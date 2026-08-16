import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import { supabase } from './supabase'

// Capture URL immediately at module load — before anything can clear it
const _INIT_SEARCH = window.location.search
const _INIT_HASH = window.location.hash
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import confetti from 'canvas-confetti'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

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

const ACTIVITY_DATA = [
  { src: '/slides/slide3.jpg',  label: 'Sponsor a Class',             sub: '$180 · Jewish Grow Retreat' },
  { src: '/slides/pesach3.jpg', label: 'Sponsor a Small Meal',       sub: '$360 · Shabbos & holiday meals' },
  { src: '/slides/slide5.jpg',  label: 'Shabbaton Scholarship',       sub: '$540 · Send a girl to Shabbaton' },
  { src: '/slides/slide6.jpg',  label: "Women's Retreat Scholarship", sub: "$770 · Women's retreat scholarship" },
  { src: '/slides/pesach2.jpg', label: 'Yom Tov Meal',               sub: '$1,200 · Full Yom Tov celebration' },
  { src: '/slides/slide2.jpg',  label: 'Girls Retreat Scholarship',   sub: '$1,800 · Jewish girls retreat' },
  { src: '/slides/slide3.jpg',  label: 'GROW Girls',                  sub: 'Girls thriving together' },
  { src: '/slides/slide1.jpg',  label: 'Girls Unite',                 sub: 'The Chabad community' },
  { src: '/slides/pesach6.jpg', label: 'Outdoors Together',           sub: 'Nature & fresh air' },
  { src: '/slides/slide4.jpg',  label: 'Chabad Team',                 sub: 'Growing together' },
  { src: '/slides/slide7.jpg',  label: 'Havdalah Night',             sub: 'Jewish light & warmth' },
]

const COIN_MESSAGES = [
  { text: 'You just added light',        sub: (amt) => `$${amt} — tzedakah illuminates the world` },
  { text: 'A soul was uplifted',         sub: (amt) => `$${amt} dropped — your kindness reaches far` },
  { text: 'The world is brighter',       sub: (amt) => `$${amt} — one coin, one moment of goodness` },
  { text: 'Hashem sees every coin',      sub: (amt) => `$${amt} — nothing goes unnoticed` },
  { text: 'You are making history',      sub: (amt) => `$${amt} — your name is written in kindness` },
  { text: 'A mitzvah that lives forever', sub: (amt) => `$${amt} — tzedakah tatzil mimavet` },
  { text: 'Your heart is golden',        sub: (amt) => `$${amt} added — pure and beautiful` },
  { text: 'Changing lives right now',    sub: (amt) => `$${amt} — someone will feel this` },
  { text: 'You are a blessing',          sub: (amt) => `$${amt} — the world needs exactly you` },
  { text: 'Am Yisrael Chai!',            sub: (amt) => `$${amt} — strong, giving, unstoppable` },
]

// FIX #23 — use <img> tags with alt text instead of background-image
function PhotoStrip() {
  return (
    <div className="photo-strip-section">
      <div className="photo-strip-header">
        <span className="photo-strip-label">CHABAD JEWISH GREENBUSH RETREAT</span>
        <span className="photo-strip-sub">Swipe to explore</span>
      </div>
      <div className="photo-strip">
        {ACTIVITY_DATA.map((item) => (
          <div key={item.label} className="photo-strip-card">
            <img
              src={item.src}
              alt={item.label}
              className="photo-strip-img"
              loading="lazy"
              onError={e => { e.target.style.display = 'none' }}
            />
            <div className="photo-strip-caption-block">
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
    <div className="payment-modal" onClick={e => e.stopPropagation()} style={{position:'relative'}}>
      <button className="payment-modal-close" onClick={onClose} style={{position:'absolute',top:12,right:12,zIndex:10}}>✕</button>
      <div className="payment-modal-header">
        <div className="payment-modal-title">Complete Donation</div>
        <div className="payment-modal-amount">${amount.toFixed(2)}</div>
      </div>
      <PaymentElement />
      {error && <div className="payment-modal-error">{error}</div>}
      <button className="payment-modal-btn" onClick={handleSubmit} disabled={loading || !stripe}>
        {loading ? 'Processing...' : `Donate $${amount.toFixed(2)}`}
      </button>
      <div className="payment-modal-secure"><LockIcon size={12} /> Secured by Stripe</div>
    </div>
  )
}

// Fixed scattered positions for the coin pile — outside component so PushkaVisual doesn't remount
// y values start at 30 to clear the pushka body's rounded-bottom clipping zone
// Deterministic PRNG so the "random" pile scatter is stable across re-renders
// and between sessions (mulberry32).
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Organic coin scatter: rows loosely stack bottom-to-top, but each coin gets
// randomized x offset, row-height jitter, wider rotation, and slight scale
// variance so the pile reads as naturally tossed-in rather than a grid.
function buildOrganicPilePositions() {
  const rng = mulberry32(20260810)
  const rowHeight = 26
  const cols = [0, 27, 55, 83, 111, 138]
  // Precompute a small stable x/rotation/scale jitter per (column, row-in-column)
  // slot up front, then assign coins to columns round-robin (always filling
  // whichever column is currently shortest) so the pile is provably level —
  // no column can ever fall behind by more than one coin, at any fill count,
  // instead of only being level at exact multiples of 6.
  const heights = cols.map(() => 0)
  const positions = []
  for (let i = 0; i < 66; i++) {
    let col = 0
    for (let c = 1; c < cols.length; c++) {
      if (heights[c] < heights[col]) col = c
    }
    const levelInCol = heights[col]
    heights[col]++
    const stagger = levelInCol % 2 === 1 ? 11 : 0
    const xJitter = (rng() - 0.5) * 5
    const yJitter = (rng() - 0.5) * 3
    positions.push({
      x: Math.max(0, Math.min(148, cols[col] + stagger + xJitter)),
      y: Math.round(24 + levelInCol * rowHeight + yJitter),
      r: Math.round((rng() - 0.5) * 22),
      s: +(0.96 + rng() * 0.08).toFixed(2),
    })
  }
  return positions
}

const PILE_POSITIONS = buildOrganicPilePositions()

const PRESTIGE_TIERS = [
  { name: 'Prophetess Level', min: 0    },
  { name: 'Sarah',            min: 180  },
  { name: 'Miriam',           min: 360  },
  { name: 'Devorah',          min: 540  },
  { name: 'Chana',            min: 770  },
  { name: 'Chulda',           min: 1200 },
  { name: 'Esther',           min: 1800 },
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

// FIX #1 — ADMIN_PASSWORD removed entirely; admin access gated by email server-side via RLS
const ZELLE_PHONE = '5187276037'

const CAUSES = [
  { id: 'general',      name: 'Where Most Needed',    desc: 'Let the Chabad direct your donation where it is needed most right now.' },
  { id: 'scholarships', name: 'Scholarships',          desc: 'Help Jewish children and families access programs and education through scholarship support.' },
  { id: 'newwing',      name: 'New Wing Campaign',     desc: 'Contribute to the new building wing that will expand our community\'s capacity to serve.' },
  { id: 'kitchen',      name: "Raizel's Kitchen",      desc: 'Support Esther\'s Kitchen — providing warm Shabbos and holiday meals to the community.' },
  { id: 'levels',       name: 'Levels Campaign',       desc: 'Join our Levels Campaign and help us reach our fundraising milestones together.' },
]

// Keys that persist to localStorage
const PERSIST_KEYS = [
  'screen',
  'streak', 'totalPersonal', 'totalRaised', 'communityGoal', 'seenIntro',
  'donations', 'allDonations', 'pushkaGoal', 'pushkaDeadline', 'pushkaBalance', 'pendingPayment', 'pileCoins',
  'pushkaTheme', 'pushkaDedication',
  'autoPayEnabled', 'autoPayThreshold', 'lastCustomAmount',
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
    if (saved.streak && saved.lastStreakDate) {
      const last = new Date(saved.lastStreakDate)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (last.toDateString() !== new Date().toDateString() && last.toDateString() !== yesterday.toDateString()) {
        saved.streak = 0
      }
    }
    return saved
  } catch { return {} }
}

const initialState = {
  screen: 'home',
  menuOpen: false,
  dbDonations: null,
  dbUsers: null,
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
  totalRaisedLoading: true,
  communityGoal: 36000,
  pushkaBalance: 0,
  pushkaGoal: 100,
  showAuthSheet: false,
  pushkaDeadline: '',
  pushkaTheme: 'pearl',
  pushkaDedication: '',
  streak: 0,
  totalPersonal: 0,
  ...getPrestige(0),
  donations: [],
  selectedAmount: null,
  customAmount: '',
  showHomeCustom: false,
  lastCustomAmount: null,
  pendingPayment: 0,
  showGoalPicker: false,
  donationNote: '',
  authPassword2: '',
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
  reminderEnabled: true,
  reminderTime: '09:00',
  reminderFrequency: 'daily',
  reminderError: '',  // FIX #21

  // Recurring payments
  recurringEnabled: false,
  recurringAmount: 18,
  recurringFrequency: 'weekly',
  lastRecurringDate: null,
  lastStreakDate: null,
  seenIntro: false,

  // Yahrtzeit reminders
  yahrtzeits: [],
  yahrtzeitDraft: { name: '', day: 7, month: 3 },
  yahrtzeitSaving: false,
}

// FIX #12 — corrected Shabbat day calculation
const isRecurringDue = (frequency, lastDate) => {
  if (!lastDate) return true
  const last = new Date(lastDate)
  const now = new Date()
  const daysSince = Math.floor((now - last) / 86400000)
  if (frequency === 'daily') return daysSince >= 1
  if (frequency === 'weekly') return daysSince >= 7
  if (frequency === 'monthly') return daysSince >= 30
  if (frequency === 'shabbat') {
    const lastFriday = new Date(now)
    const dayOfWeek = now.getDay()
    // Days since last Friday: Fri=0, Sat=1, Sun=2, Mon=3, Tue=4, Wed=5, Thu=6
    const daysSince = dayOfWeek === 5 ? 0 : (dayOfWeek + 2) % 7
    lastFriday.setDate(now.getDate() - daysSince)
    lastFriday.setHours(0, 0, 0, 0)
    return new Date(lastDate) < lastFriday
  }
  return false
}

// FIX #13 — Menu/Nav/BottomNav defined outside App to prevent remount on every render

// ── minimal line-icon set (replaces emoji-as-icons throughout the nav/menu) ──
const Icon = ({ children, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
)
const MenuIcon = p => <Icon {...p}><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></Icon>
const ShareIcon = p => <Icon {...p}><path d="M12 16V4" /><path d="M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></Icon>
const CoinIcon = p => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M9.5 9.5a2.2 2.2 0 0 1 2.5-1.5c1.4 0 2.4.7 2.4 1.8s-1 1.5-2.4 1.7c-1.5.2-2.5.7-2.5 1.9 0 1.1 1 1.8 2.4 1.8a2.2 2.2 0 0 0 2.5-1.5" /></Icon>
const CardIcon = p => <Icon {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><line x1="3" y1="10.5" x2="21" y2="10.5" /><line x1="6.5" y1="14.5" x2="10" y2="14.5" /></Icon>
const ClockIcon = p => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Icon>
const QuestionIcon = p => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2-2.3 3.5" /><circle cx="12" cy="16.7" r="0.4" fill="currentColor" stroke="none" /></Icon>
const GearIcon = p => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V4.5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>
const ShieldIcon = p => <Icon {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></Icon>
const LogoutIcon = p => <Icon {...p}><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="M16 17l5-5-5-5" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>
const SparkleIcon = p => <Icon {...p}><path d="M12 4l1.6 4.9L18.5 10.5l-4.9 1.6L12 17l-1.6-4.9L5.5 10.5l4.9-1.6z" /></Icon>
const UserIcon = p => <Icon {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></Icon>
const FireIcon = p => <Icon {...p}><path d="M12 3c1 3-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c0-1-.5-1.5-.5-1.5 1.5 1 2.5 2.8 2.5 4.5a5 5 0 0 1-10 0C6.5 9 9 7.5 12 3z" /></Icon>
const CalendarIcon = p => <Icon {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></Icon>
const RefreshIcon = p => <Icon {...p}><path d="M4 12a8 8 0 0 1 14-5.3L21 9" /><path d="M21 4v5h-5" /><path d="M20 12a8 8 0 0 1-14 5.3L3 15" /><path d="M3 20v-5h5" /></Icon>
const BellIcon = p => <Icon {...p}><path d="M12 4a5 5 0 0 0-5 5v3.5c0 1-.4 2-1.2 2.7L4.5 17h15l-1.3-1.8c-.8-.7-1.2-1.7-1.2-2.7V9a5 5 0 0 0-5-5z" /><path d="M10 20a2 2 0 0 0 4 0" /></Icon>
const CandleFlameIcon = p => <Icon {...p}><rect x="9.5" y="12" width="5" height="8" rx="1" /><path d="M12 4c1.2 2 2.2 3.3 2.2 5a2.2 2.2 0 1 1-4.4 0c0-1.7 1-3 2.2-5z" /></Icon>
const TargetIcon = p => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></Icon>
const PaletteIcon = p => <Icon {...p}><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2a3.5 3.5 0 0 0 3.5-3.5c0-4.2-3.8-7.7-8.4-7.7z" /><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" /><circle cx="11" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" /></Icon>
const TrashIcon = p => <Icon {...p}><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></Icon>
const DocumentIcon = p => <Icon {...p}><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4" /><line x1="8.5" y1="12" x2="15.5" y2="12" /><line x1="8.5" y1="15.5" x2="15.5" y2="15.5" /></Icon>
const LinkIcon = p => <Icon {...p}><path d="M9.5 14.5l5-5" /><path d="M11 6.5l1-1a3.5 3.5 0 0 1 5 5l-1 1" /><path d="M13 17.5l-1 1a3.5 3.5 0 0 1-5-5l1-1" /></Icon>
const AlertTriangleIcon = p => <Icon {...p}><path d="M12 4.5l9 15.5H3z" /><line x1="12" y1="10" x2="12" y2="14.5" /><circle cx="12" cy="17.2" r="0.4" fill="currentColor" stroke="none" /></Icon>
const HeartIcon = p => <Icon {...p}><path d="M12 20.5c-.3 0-.6-.1-.8-.3C7.8 17.5 3 13.7 3 9.3 3 6.4 5.3 4 8.2 4c1.6 0 3 .7 3.8 1.9C12.8 4.7 14.2 4 15.8 4 18.7 4 21 6.4 21 9.3c0 4.4-4.8 8.2-8.2 10.9-.2.2-.5.3-.8.3z" /></Icon>
const BookIcon = p => <Icon {...p}><path d="M12 6.5c-2-1.3-5-1.7-8-1v13c3-.7 6-.3 8 1 2-1.3 5-1.7 8-1v-13c-3-.7-6-.3-8 1z" /><line x1="12" y1="6.5" x2="12" y2="19.5" /></Icon>
const BuildingIcon = p => <Icon {...p}><path d="M4 10l8-5 8 5" /><rect x="5" y="10" width="14" height="9" /><line x1="9" y1="10" x2="9" y2="19" /><line x1="15" y1="10" x2="15" y2="19" /><line x1="3" y1="19" x2="21" y2="19" /></Icon>
const BowlIcon = p => <Icon {...p}><path d="M4 12a8 8 0 0 0 16 0z" /><line x1="3" y1="12" x2="21" y2="12" /><path d="M9.5 9c0-1 .5-1.5.5-2.5S9.5 5 9.5 5" /><path d="M14.5 9c0-1 .5-1.5.5-2.5S14.5 5 14.5 5" /></Icon>
const StarIcon = p => <Icon {...p}><path d="M12 3.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" /></Icon>
const LockIcon = p => <Icon {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
const MailIcon = p => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>
const BankIcon = p => <Icon {...p}><path d="M3 10l9-6 9 6" /><line x1="4" y1="10" x2="20" y2="10" /><line x1="5" y1="10" x2="5" y2="18" /><line x1="10" y1="10" x2="10" y2="18" /><line x1="14" y1="10" x2="14" y2="18" /><line x1="19" y1="10" x2="19" y2="18" /><line x1="3" y1="18" x2="21" y2="18" /></Icon>
const EditIcon = p => <Icon {...p}><path d="M4 20l.9-4.2L16 4.7a1.5 1.5 0 0 1 2.1 0l1.2 1.2a1.5 1.5 0 0 1 0 2.1L8.2 19.1z" /><line x1="14.5" y1="6.2" x2="17.8" y2="9.5" /></Icon>

const CAUSE_ICONS = {
  general: HeartIcon,
  scholarships: BookIcon,
  newwing: BuildingIcon,
  kitchen: BowlIcon,
  levels: StarIcon,
}

function Menu({ menuOpen, user, set, onSignOut }) {
  return (
    <div className={`menu-overlay ${menuOpen ? 'open' : ''}`} onClick={() => set({ menuOpen: false })}>
      <div className="menu-panel" onClick={e => e.stopPropagation()}>
        <div className="menu-header">
          <div className="menu-avatar">{user ? <UserIcon size={20} /> : <CoinIcon size={20} />}</div>
          <div>
            <div className="menu-app-name">GROW Pushka</div>
            <div className="menu-mode">
              {user ? (user.user_metadata?.full_name || user.email) : 'Guest Mode'}
            </div>
          </div>
          <button className="menu-close" onClick={() => set({ menuOpen: false })}>✕</button>
        </div>
        {[
          { icon: <CoinIcon size={18} />, label: 'My Pushka', screen: 'home' },
          { icon: <CardIcon size={18} />, label: 'Pay Now', screen: 'checkout' },
          { icon: <ClockIcon size={18} />, label: 'History', screen: 'history' },
          { icon: <QuestionIcon size={18} />, label: 'FAQ', screen: 'faq' },
          { icon: <GearIcon size={18} />, label: 'Settings', screen: 'settings' },
          ...(user?.email === 'adlaber@gmail.com' ? [{ icon: <ShieldIcon size={18} />, label: 'Admin', screen: 'admin' }] : []),
        ].map(item => (
          <button key={item.label} className="menu-item" onClick={() => set({ screen: item.screen, menuOpen: false })}>
            <span className="menu-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="menu-divider" />
        {user ? (
          <button className="menu-item menu-signout" onClick={onSignOut}>
            <span className="menu-item-icon"><LogoutIcon size={18} /></span>
            <span>Sign Out</span>
          </button>
        ) : (
          <button className="menu-item menu-signin-item" onClick={() => set({ screen: 'signin', menuOpen: false })}>
            <span className="menu-item-icon"><SparkleIcon size={18} /></span>
            <span>Sign In / Sign Up</span>
          </button>
        )}
        <div style={{ textAlign: 'center', padding: '16px 0 4px', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'sans-serif' }}>
          App by Schneur Laber · <a href="mailto:schneurlaber@gmail.com" style={{ color: 'rgba(255,255,255,0.4)' }}>schneurlaber@gmail.com</a>
        </div>
      </div>
    </div>
  )
}

const LEVEL_NEXT = { 'Prophetess Level': 'Sarah', Sarah: 'Miriam', Miriam: 'Devorah', Devorah: 'Chana', Chana: 'Chulda', Chulda: 'Esther', Esther: null }
const LEVEL_MINS = { 'Prophetess Level': 0, Sarah: 180, Miriam: 360, Devorah: 540, Chana: 770, Chulda: 1200, Esther: 1800 }

function LevelDropdown({ prestige, prestigeNext, prestigeAtMax, totalPersonal, streak }) {
  const [open, setOpen] = useState(false)
  const nextName = LEVEL_NEXT[prestige]
  const nextMin = nextName ? LEVEL_MINS[nextName] : null
  const curMin = LEVEL_MINS[prestige] || 0
  const pct = nextMin ? Math.min(100, Math.round(((totalPersonal - curMin) / (nextMin - curMin)) * 100)) : 100

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: '1.5px solid var(--gold)', borderRadius: 50, padding: '4px 12px', color: 'var(--gold)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <span className="level-badge-full">{prestige}</span>
        <span className="level-badge-short">{prestige === 'Prophetess Level' ? 'Level' : prestige}</span>
        {open ? ' ▲' : ' ▼'}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: 16, minWidth: 220, zIndex: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{prestige}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Total donated: <strong style={{color:'var(--teal)'}}>${totalPersonal?.toFixed(2) || '0.00'}</strong></div>
          {nextName ? (
            <>
              <div style={{ fontSize: 12, color: '#444', fontWeight: 600, marginBottom: 6 }}>${prestigeNext} to reach <strong style={{color:'#222'}}>{nextName}</strong></div>
              <div style={{ background: '#ddd', borderRadius: 50, height: 6, overflow: 'hidden' }}>
                <div style={{ background: 'var(--gold)', width: pct + '%', height: '100%', borderRadius: 50, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginTop: 4, textAlign: 'right' }}>{pct}%</div>
            </>
          ) : <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}><StarIcon size={13} /> Max Level Reached!</div>}
          {streak > 0 && <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, color: '#111', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 5 }}><FireIcon size={14} /> {streak}-day streak — keep going!</div>}
          <div style={{ marginTop: 8, fontSize: 12, color: '#111', fontWeight: 900, lineHeight: 1.9 }}>
            Sarah ($180) → Miriam ($360) → Devorah ($540) → Chana ($770) → Chulda ($1,200) → Esther ($1,800)
          </div>
        </div>
      )}
    </div>
  )
}

function Nav({ title, shareToast, set, prestige, streak, prestigeNext, prestigeAtMax, totalPersonal }) {
  const isHome = title.includes('Pushka')
  return (
    <div className="nav">
      <button className="nav-btn nav-btn-icon" onClick={() => set({ menuOpen: true })} aria-label="Menu">
        <MenuIcon size={19} />
      </button>
      <div className="nav-title">{title}</div>
      <div className="nav-right">
        {isHome && prestige && (
          <LevelDropdown prestige={prestige} prestigeNext={prestigeNext} prestigeAtMax={prestigeAtMax} totalPersonal={totalPersonal} streak={streak} />
        )}
        <button className="nav-btn share-btn" onClick={async () => {
          try {
            await navigator.share({ title: 'Jewish Greenbush Chabad Pushka', text: 'I found this amazing app where I track my tzedakah in a digital pushka! Join me in supporting Jewish Greenbush Chabad', url: window.location.href })
          } catch {
            await navigator.clipboard.writeText(window.location.href).catch(() => {})
            set({ shareToast: true })
            setTimeout(() => set({ shareToast: false }), 2000)
          }
        }}>{shareToast ? '✓ Copied!' : <><ShareIcon size={14} /> Share</>}</button>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card" style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', paddingRight: 12 }}>{q}</div>
        <div style={{ fontSize: 18, color: 'var(--gold)', flexShrink: 0 }}>{open ? '−' : '+'}</div>
      </div>
      {open && <p style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>{a}</p>}
    </div>
  )
}

export default function App() {
  const [s, setS] = useState(() => ({ ...initialState, ...loadSaved() }))
  const coinTimerRef = useRef(null)
  const audioCtxRef = useRef(null)
  const reminderTimerRef = useRef(null)
  const saveTimerRef = useRef(null)
  const cloudLoadedRef = useRef(false)
  const timersRef = useRef([])
  const isDroppingRef = useRef(false)
  const pendingDropQueueRef = useRef(0)
  const isRecoveryRef = useRef(false)
  const stateRef = useRef(s)
  stateRef.current = s
  const successMsg = useRef("You've just added light to the world. Your tzedakah makes a real difference!")
  useEffect(() => {
    if (s.screen === 'success') {
      const msgs = [
        "You've just added light to the world. Your tzedakah makes a real difference!",
        "Every dollar you gave is a mitzvah. Thank you for filling your pushka!",
        "Your kindness fuels Shabbos tables, retreats, and smiles. You are a true blessing!",
        "Tzedakah saves! Your donation is already making waves in our community. Chazak!",
        "You did it! Your pushka is emptied and your merit is full. Jewish Greenbush Chabad thanks you!",
        "From your pushka to our community — thank you for being part of something beautiful!",
      ]
      successMsg.current = msgs[Math.floor(Math.random() * msgs.length)]
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 }, colors: ['#C8922A', '#F5EDD8', '#3b6fd4', '#ffe878', '#4ade80'] })
    }
  }, [s.screen]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (updates) => setS(prev => ({ ...prev, ...updates }))

  // FIX #16 — helper to register timers for cleanup
  const addTimer = (fn, delay) => {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout)
  }, [])

  // FIX #5 — saveToCloud reads from stateRef so debounce always gets fresh state
  const saveToCloud = useCallback(() => {
    const state = stateRef.current
    // FIX #24 — never save until the initial cloud load for this session has
    // resolved; otherwise default/local state (e.g. totalPersonal: 0) can win
    // a race against the real data still loading and overwrite it permanently
    if (!state.user || !cloudLoadedRef.current) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const snap = stateRef.current
      await supabase.from('user_data').upsert({
        user_id: snap.user.id,
        email: snap.user.email || null,
        full_name: snap.user.user_metadata?.full_name || null,
        streak: snap.streak,
        last_streak_date: snap.lastStreakDate,
        pushka_balance: snap.pushkaBalance,
        pending_payment: snap.pendingPayment,
        pile_coins: snap.pileCoins,
        pushka_goal: snap.pushkaGoal,
        total_personal: snap.totalPersonal,
        donations: snap.donations,
        auto_pay_enabled: snap.autoPayEnabled,
        auto_pay_threshold: snap.autoPayThreshold,
        reminder_enabled: snap.reminderEnabled,
        reminder_time: (() => {
          // Convert local reminder time to UTC for server-side cron comparison
          const [hh, mm] = (snap.reminderTime || '09:00').split(':').map(Number)
          const d = new Date(); d.setHours(hh, mm, 0, 0)
          return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`
        })(),
        reminder_frequency: snap.reminderFrequency,
        recurring_enabled: snap.recurringEnabled,
        recurring_amount: snap.recurringAmount,
        recurring_frequency: snap.recurringFrequency,
        last_recurring_date: snap.lastRecurringDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }, 2000)
  }, [])

  // FIX #27 — real background push notifications (service worker + server-sent
  // push), replacing the old client-side setTimeout that only fired while the
  // app was open. urlBase64ToUint8Array is the standard Web Push boilerplate
  // for turning the VAPID public key into the format PushManager expects.
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }

  // FIX #29 — returns a real result instead of silently swallowing every
  // failure, so the UI can actually tell the user what happened
  const subscribeToPush = useCallback(async (userId) => {
    try {
      if (!userId) return { ok: false, reason: 'You need to be signed in for push reminders.' }
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { ok: false, reason: "This device doesn't support push notifications — you'll still get email reminders." }
      }
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return { ok: false, reason: 'Notification permission was not granted.' }
      }
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidKey) return { ok: false, reason: 'Push notifications are not configured yet.' }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }
      const { error } = await supabase.from('user_data').update({ push_subscription: sub.toJSON() }).eq('user_id', userId)
      if (error) return { ok: false, reason: "Couldn't save your notification settings — try again." }
      return { ok: true }
    } catch (e) {
      console.error('Push subscription failed', e)
      return { ok: false, reason: e?.message || 'Something went wrong turning on notifications.' }
    }
  }, [])

  // FIX #6 — loadFromCloud wrapped in useCallback; only depends on stable refs
  const loadFromCloud = useCallback(async (user) => {
    const { data: yzData } = await supabase.from('yahrtzeits').select('*').eq('user_id', user.id)
    if (yzData) setS(prev => ({ ...prev, yahrtzeits: yzData }))

    const { data } = await supabase.from('user_data').select('*').eq('user_id', user.id).single()
    if (!data) { cloudLoadedRef.current = true; return }
    // Reset streak if last activity was before yesterday
    let streak = data.streak ?? 0
    const lastStreakDate = data.last_streak_date
    if (streak > 0 && lastStreakDate) {
      const last = new Date(lastStreakDate)
      const today = new Date()
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
      if (last.toDateString() !== today.toDateString() && last.toDateString() !== yesterday.toDateString()) {
        streak = 0
      }
    }

    const loaded = {
      streak,
      lastStreakDate: data.last_streak_date,
      pushkaBalance: Number(data.pushka_balance) || 0,
      pendingPayment: Number(data.pending_payment) || 0,
      pileCoins: Array.isArray(data.pile_coins) ? data.pile_coins : [],
      pushkaGoal: Number(data.pushka_goal) || 100,
      totalPersonal: Number(data.total_personal) || 0,
      donations: data.donations || [],
      allDonations: data.donations || [],
      autoPayEnabled: data.auto_pay_enabled || false,
      autoPayThreshold: data.auto_pay_threshold || 180,
      reminderEnabled: data.reminder_enabled || false,
      reminderTime: (() => {
        const [hh, mm] = (data.reminder_time || '09:00').split(':').map(Number)
        const d = new Date(); d.setUTCHours(hh, mm, 0, 0)
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
      })(),
      reminderFrequency: data.reminder_frequency || '2x-week',
      recurringEnabled: data.recurring_enabled || false,
      recurringAmount: data.recurring_amount || 18,
      recurringFrequency: data.recurring_frequency || 'weekly',
      lastRecurringDate: data.last_recurring_date,
      ...getPrestige(Number(data.total_personal) || 0),
    }
    const existing = loadSaved()
    localStorage.setItem('pushka_state', JSON.stringify({ ...existing, ...loaded }))
    setS(prev => ({ ...prev, ...loaded }))
    cloudLoadedRef.current = true
    if (loaded.recurringEnabled && isRecurringDue(loaded.recurringFrequency, loaded.lastRecurringDate)) {
      setS(prev => ({ ...prev, recurringDue: true }))
    }
  }, [])

  // Persist to localStorage + cloud whenever key state changes
  const persistSnapshot = PERSIST_KEYS.map(k => {
    const v = s[k]
    return typeof v === 'object' ? JSON.stringify(v) : String(v)
  }).join('||')
  useEffect(() => {
    const toSave = {}
    PERSIST_KEYS.forEach(k => { if (s[k] !== undefined) toSave[k] = s[k] })
    localStorage.setItem('pushka_state', JSON.stringify(toSave))
    saveToCloud()
  }, [persistSnapshot]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check for due recurring payment on load (guest/no cloud)
  useEffect(() => {
    if (!s.user && s.recurringEnabled && isRecurringDue(s.recurringFrequency, s.lastRecurringDate)) {
      set({ recurringDue: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // FIX #15 — community total with error handling (no longer fetches all rows silently)
  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const { data, error } = await supabase
          .from('donations')
          .select('amount')
          .eq('status', 'confirmed')
        if (error) throw error
        const total = (data || []).reduce((sum, d) => sum + Number(d.amount), 0)
        set({ totalRaised: total, totalRaisedLoading: false })
      } catch {
        set({ totalRaisedLoading: false })
      }
    }
    fetchTotal()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-migrate existing users who already had reminders on to real push,
  // so they don't have to manually re-toggle the setting to get it
  useEffect(() => {
    if (!s.user?.id || !s.reminderEnabled) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    subscribeToPush(s.user.id)
  }, [s.user?.id, s.reminderEnabled, subscribeToPush])

  // Schedule browser notification for reminders
  useEffect(() => {
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current)
    if (!s.reminderEnabled) return

    // Guard: Notification API is not available on all devices (e.g. iOS Safari)
    const notifSupported = typeof Notification !== 'undefined'
    if (!notifSupported || Notification.permission !== 'granted') return

    const scheduleNotif = () => {
      try {
        const now = new Date()
        const [hh, mm] = (s.reminderTime || '09:00').split(':').map(Number)
        const target = new Date()
        target.setHours(hh, mm, 0, 0)
        if (target <= now) target.setDate(target.getDate() + 1)
        const delay = target - now

        reminderTimerRef.current = setTimeout(() => {
          try {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('GROW Pushka', {
                body: 'A little tzedakah goes a long way',
                icon: '/favicon.ico',
              })
            }
          } catch {}
          if (s.reminderFrequency === 'daily') scheduleNotif()
        }, delay)
      } catch {}
    }

    scheduleNotif()
    return () => clearTimeout(reminderTimerRef.current)
  }, [s.reminderEnabled, s.reminderTime, s.reminderFrequency])

  // Check Supabase session on mount + handle OAuth redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        isRecoveryRef.current = true
        set({ screen: 'reset-password', user: session?.user || null })
        return
      }
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setS(prev => ({ ...prev, user: session.user }))
        return
      }
      if (event === 'SIGNED_IN' && session?.user) {
        setS(prev => {
          if (prev.screen === 'reset-password' || isRecoveryRef.current) {
            return { ...prev, user: session.user, screen: 'reset-password' }
          }
          // Same user already in app — just update token, don't touch screen
          if (prev.user?.id === session.user.id) {
            return { ...prev, user: session.user }
          }
          loadFromCloud(session.user)
          return { ...prev, user: session.user, screen: 'home' }
        })
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('pushka_state')
        cloudLoadedRef.current = false
        set({ user: null, pushkaBalance: 0, pileCoins: [], pendingPayment: 0, customAmount: '', donations: [], streak: 0, totalPersonal: 0, ...getPrestige(0) })
      }
    })

    const init = async () => {
      const searchParams = new URLSearchParams(_INIT_SEARCH)
      const hashParams = new URLSearchParams(_INIT_HASH.replace('#', ''))
      const code = searchParams.get('code') || hashParams.get('code')
      const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash')
      const isRecovery = searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery'

      if (isRecovery) isRecoveryRef.current = true

      // token_hash flow — email links directly to buildbitachon.org
      if (tokenHash && isRecovery) {
        window.history.replaceState({}, '', '/')
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        if (error) {
          set({ screen: 'signin', authError: 'Reset link expired or already used. Please request a new one.' })
        } else if (data?.session?.user) {
          set({ screen: 'reset-password', user: data.session.user })
        }
        return
      }

      // code flow — Supabase redirected here with a code
      if (code) {
        window.history.replaceState({}, '', '/')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          if (isRecovery) set({ screen: 'signin', authError: 'Reset link expired or already used. Please request a new one.' })
        } else if (data?.session?.user) {
          if (isRecovery || isRecoveryRef.current) {
            set({ screen: 'reset-password', user: data.session.user })
          } else {
            set({ user: data.session.user, screen: 'home' })
            loadFromCloud(data.session.user)
          }
        }
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const saved = loadSaved()
        const validScreens = ['home', 'history', 'settings', 'admin']
        const restoredScreen = validScreens.includes(saved.screen) ? saved.screen : 'home'
        set({ user: session.user, screen: restoredScreen })
        loadFromCloud(session.user)
      } else {
        // Guest — show sign up sheet after short delay
        setTimeout(() => set({ showAuthSheet: true }), 1200)
      }
    }

    init()
    return () => subscription.unsubscribe()
  }, [loadFromCloud])

  // FIX #14 — admin donations query moved into useEffect (not render body)
  useEffect(() => {
    if (s.screen === 'admin' && s.user?.email === 'adlaber@gmail.com') {
      if (!s.dbDonations) {
        supabase
          .from('donations')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data }) => set({ dbDonations: data || [] }))
      }
      if (!s.dbUsers) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          fetch('/api/admin-users', {
            headers: { Authorization: `Bearer ${session?.access_token}` }
          })
            .then(r => r.json())
            .then(({ users }) => set({ dbUsers: users || [] }))
        })
      }
    }
  }, [s.screen, s.user?.email, s.dbDonations, s.dbUsers])

  const pct = (a, b) => Math.min(Math.round((a / b) * 100), 100)

  // ── AUTH ──
  const handleSignIn = async () => {
    set({ authLoading: true, authError: '' })
    const { error } = await supabase.auth.signInWithPassword({
      email: s.authEmail,
      password: s.authPassword,
    })
    if (error) {
      const msg = error.message.toLowerCase().includes('email not confirmed')
        ? 'Please verify your email first — check your inbox for a confirmation link.'
        : error.message
      set({ authLoading: false, authError: msg })
    } else {
      set({ authLoading: false, screen: 'home', authEmail: '', authPassword: '', seenIntro: true })
    }
  }

  const handleSignUp = async () => {
    if (!s.authName.trim()) return set({ authError: 'Please enter your name' })
    if (!s.authEmail.trim()) return set({ authError: 'Please enter your email' })
    if (s.authPassword.length < 8) return set({ authError: 'Password must be at least 8 characters' })
    set({ authLoading: true, authError: '' })
    const { data, error } = await supabase.auth.signUp({
      email: s.authEmail,
      password: s.authPassword,
      options: {
        data: { full_name: s.authName },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      set({ authLoading: false, authError: error.message })
    } else if (data?.user && !data?.session) {
      if (data.user.identities && data.user.identities.length === 0) {
        set({ authLoading: false, authError: 'An account with this email already exists. Please sign in instead.' })
      } else {
        set({ authLoading: false, screen: 'verify-email', authEmail: s.authEmail })
      }
    } else {
      // Fire-and-forget welcome email
      fetch('/api/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.authName, email: s.authEmail }),
      }).catch(() => {})
      set({ authLoading: false, screen: 'home', authEmail: '', authPassword: '', authName: '' })
    }
  }

  const googleCallback = async ({ credential }) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })
    if (error) {
      set({ authError: error.message })
      return
    }
    if (data?.session?.user) {
      set({ user: data.session.user, screen: 'home' })
      // FIX #25 — must load explicitly: the onAuthStateChange listener's
      // "same user, skip loadFromCloud" dedup check can race against the
      // set() above and think this user's data is already loaded when
      // it never was, leaving the user signed in with empty local data
      loadFromCloud(data.session.user)
    }
  }

  // FIX #11 — check for existing script before appending
  const renderGoogleButton = (elementId) => {
    const init = () => {
      // FIX #2 — Google Client ID from env var
      window.google.accounts.id.initialize({
        client_id: (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim(),
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
    if (window.google) {
      init()
    } else if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = init
      document.head.appendChild(script)
    }
  }

  useEffect(() => {
    if (s.screen === 'signin') renderGoogleButton('google-btn-signin')
    if (s.screen === 'signup') renderGoogleButton('google-btn-signup')
    if (s.screen === 'checkout' && !s.customAmount && s.pushkaBalance > 0) {
      set({ customAmount: String(parseFloat(s.pushkaBalance.toFixed(2))) })
    }
  }, [s.screen])

  const changeGoal = (newGoal) => {
    if (!newGoal || newGoal <= 0) return
    const cappedBalance = Math.min(s.pushkaBalance, newGoal)
    if (cappedBalance < s.pushkaBalance && !window.confirm(`Your current balance ($${s.pushkaBalance.toFixed(2)}) is above the new goal. It will be reduced to $${cappedBalance.toFixed(2)}. Continue?`)) return
    const newNumPile = Math.min(
      cappedBalance > 0 ? Math.max(1, Math.round((cappedBalance / newGoal) * PILE_POSITIONS.length)) : 0,
      PILE_POSITIONS.length
    )
    const newPile = PILE_POSITIONS.slice(0, newNumPile).map((_, i) => ({
      id: `pile-goal-${i}`, posIdx: i, isNew: false
    }))
    set({ pushkaGoal: newGoal, pushkaBalance: cappedBalance, pileCoins: newPile, showGoalPicker: false })
  }

  const handleSignOut = async () => {
    const hasBalance = stateRef.current.pushkaBalance > 0 || stateRef.current.pendingPayment > 0
    if (hasBalance) {
      const ok = window.confirm(
        `You have $${stateRef.current.pushkaBalance.toFixed(2)} in your pushka that hasn't been paid yet.\n\nSigning out will clear your local data. Your cloud data is saved and will reload when you sign back in.\n\nSign out anyway?`
      )
      if (!ok) return
    }
    await supabase.auth.signOut()
    localStorage.removeItem('pushka_state')
    cloudLoadedRef.current = false
    set({
      user: null, menuOpen: false,
      pushkaBalance: 0, pileCoins: [], pendingPayment: 0, customAmount: '',
      donations: [], streak: 0, totalPersonal: 0, ...getPrestige(0),
    })
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
    if (!s.user) return set({ screen: 'signup' })
    // Nothing to add once already at/over goal — bail before playing any
    // animation instead of showing "$1 dropped" for a coin that never landed
    if (stateRef.current.pushkaBalance >= stateRef.current.pushkaGoal) return
    // FIX #28 — isDroppingRef (not state) so this guard is checked
    // synchronously; the old s.isDropping read from the render closure could
    // still be stale across rapid taps in the same tick, letting overlapping
    // drops through that then raced on stale state and silently lost coins.
    // Taps that land while an animation is already playing are queued
    // (not dropped) so every tap still counts once the current one finishes.
    if (isDroppingRef.current) {
      pendingDropQueueRef.current += amount
      return
    }
    isDroppingRef.current = true

    const numCoins = visualCoinCount(amount)
    const coins = Array.from({ length: numCoins }, (_, i) => ({
      id: Date.now() + i,
      delay: i * 110,
      offset: (Math.random() - 0.5) * 20,
      dir: Math.random() > 0.5 ? 1 : -1,
    }))

    coins.forEach((_, i) => playClink(i * 110 + 620))

    // FIX #28 — every value that depends on current balance/pile is now
    // computed from `prev` inside the functional update, so concurrent
    // drops always compound correctly instead of overwriting each other
    setS(prev => {
      const today = new Date().toDateString()
      const isNewDay = !prev.lastStreakDate || new Date(prev.lastStreakDate).toDateString() !== today
      // FIX #7 — cap balance at goal to prevent out-of-bounds pile positions
      const newBalance = Math.min(prev.pushkaBalance + amount, prev.pushkaGoal)
      const newPending = prev.pendingPayment + amount
      const newNumPile = Math.min(newBalance > 0 ? Math.max(1, Math.round((newBalance / prev.pushkaGoal) * PILE_POSITIONS.length)) : 0, PILE_POSITIONS.length)
      const currentNumPile = prev.pileCoins.length
      const extraPileCoins = []
      for (let i = currentNumPile; i < newNumPile; i++) {
        extraPileCoins.push({ id: `pile-${i}-${Date.now()}-${i}`, posIdx: i, isNew: true })
      }
      return {
        ...prev,
        selectedAmount: amount,
        fallingCoins: coins,
        isDropping: true,
        pushkaBalance: newBalance,
        pendingPayment: newPending,
        pileCoins: [...prev.pileCoins, ...extraPileCoins],
        streak: isNewDay ? prev.streak + 1 : prev.streak,
        lastStreakDate: new Date().toISOString(),
        recurringDue: false,
        lastRecurringDate: new Date().toISOString(),
      }
    })

    if (coinTimerRef.current) clearTimeout(coinTimerRef.current)
    const duration = numCoins * 110 + 800
    // FIX #16 — register timers so they're cleaned up on unmount
    coinTimerRef.current = addTimer(() => {
      isDroppingRef.current = false
      setS(prev => ({
        ...prev,
        fallingCoins: [],
        isDropping: false,
        thankYouAmount: amount,
        pileCoins: prev.pileCoins.map(c => ({ ...c, isNew: false })),
        pushkaFull: prev.pushkaBalance >= prev.pushkaGoal,
      }))
      const msg = COIN_MESSAGES[Math.floor(Math.random() * COIN_MESSAGES.length)]
      setS(prev => ({ ...prev, thankYouMsg: msg }))
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 }, colors: ['#C8922A', '#F5EDD8', '#3b6fd4', '#ffe878'] })
      addTimer(() => setS(prev => ({ ...prev, thankYouAmount: null, thankYouMsg: null, selectedAmount: null })), 5000)
      // FIX #28 — re-derive auto-pay from the latest state (via stateRef)
      // instead of a value captured at click-time, which could be stale
      // now that rapid taps correctly compound the balance
      if (stateRef.current.autoPayEnabled && stateRef.current.pushkaBalance >= stateRef.current.pushkaGoal) {
        addTimer(() => handleCheckout(stateRef.current.pushkaBalance), 400)
      }
      // FIX #28 — process any taps that landed while this animation was
      // playing, so a burst of rapid clicks all end up counted instead of
      // being silently dropped once the guard above started blocking them
      if (pendingDropQueueRef.current > 0) {
        const queued = pendingDropQueueRef.current
        pendingDropQueueRef.current = 0
        dropCoins(queued)
      }
    }, duration)
  }

  // ── RESET ── clears coins from pushka after payment
  const resetPushka = () => {
    setS(prev => {
      const paid = Math.min(prev.pendingPayment, prev.pushkaGoal)
      const newBalance = Math.max(0, prev.pushkaBalance - paid)
      const newPersonal = prev.totalPersonal + paid

      const coinsToKeep = newBalance > 0 ? Math.max(1, Math.round((newBalance / prev.pushkaGoal) * PILE_POSITIONS.length)) : 0
      const newPileCoins = prev.pileCoins.slice(0, coinsToKeep)

      // FIX #19 — stable IDs for donations so React keys are correct
      const donationId = `donation-${Date.now()}-${Math.random().toString(36).slice(2)}`
      return {
        ...prev,
        pushkaBalance: newBalance,
        pendingPayment: 0,
        pushkaFull: false,
        pileCoins: newPileCoins,
        customAmount: '',
        donations: [{ id: donationId, date: 'Today', amount: paid, label: CAUSES.find(c => c.id === prev.donationCause)?.name || 'Donation', method: prev.paymentMethod }, ...prev.donations],
        allDonations: [{ id: donationId, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), amount: paid, label: CAUSES.find(c => c.id === prev.donationCause)?.name || 'Donation', method: prev.paymentMethod }, ...prev.allDonations],
        screen: 'success',
        lastDonation: paid,
        totalRaised: prev.totalRaised + paid,
        totalPersonal: newPersonal,
        donationNote: '',
        ...getPrestige(newPersonal),
      }
    })
  }

  // ── CHECKOUT / PAYMENT ──
  const handleCheckout = async (overrideAmount) => {
    const amount = overrideAmount || s.pendingPayment || s.pushkaBalance
    if (!amount) return set({ checkoutError: 'Please enter an amount to donate' })

    set({ checkoutLoading: true, checkoutError: '', pendingPayment: amount })
    try {
      // FIX #3 — Supabase URL from env var
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lscundsuxujnhsclgssx.supabase.co'
      const res = await fetch(
        `${supabaseUrl}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  // FIX #9 — saveDonation accepts status so Zelle donations are marked pending_verification
  const saveDonation = async (amount, method) => {
    await supabase.from('donations').insert({
      amount,
      method,
      cause: s.donationCause,
      user_id: s.user?.id || null,
      user_email: s.user?.email || null,
      label: CAUSES.find(c => c.id === s.donationCause)?.name || 'Donation',
      // FIX #26 — RLS now rejects any client insert that isn't pending_verification
      // (prevents anyone from inserting a pre-confirmed fake donation via the
      // public anon key); admin approves via the Verify button in /admin
      status: 'pending_verification',
      notes: s.donationNote || null,
    })
    // Notify admin with notes included
    try {
      await fetch('/api/notify-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method,
          cause: CAUSES.find(c => c.id === s.donationCause)?.name || 'Donation',
          userEmail: s.user?.email || null,
          notes: s.donationNote || null,
        }),
      })
    } catch {}
  }

  // FIX #8 — handlePaySuccess is now async and awaits saveDonation to prevent data loss
  const handlePaySuccess = async () => {
    try {
      await saveDonation(s.pendingPayment, 'card')
    } catch {
      // donation record failed silently — payment already succeeded
    }
    set({ paymentModalOpen: false, paymentClientSecret: null, customAmount: '' })
    resetPushka()
  }

  // ── PAYMENT MODAL ──
  const paymentModal = s.paymentModalOpen && s.paymentClientSecret ? (
    <div className="payment-modal-overlay" onClick={() => set({ paymentModalOpen: false })}>
      {stripePromise ? (
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
      ) : (
        <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
          <div className="auth-error">Payment is temporarily unavailable. Please use Zelle instead.</div>
          <button className="cta-btn" style={{ marginTop: 16 }} onClick={() => set({ paymentModalOpen: false, paymentMethod: 'zelle' })}>Switch to Zelle</button>
        </div>
      )}
    </div>
  ) : null

  // ── COMBINED AUTH SCREEN ──
  if (s.screen === 'signin' || s.screen === 'signup') {
    const isNew = s.screen === 'signup'
    return (
      <div className="app forest-bg">
        <div className="auth-screen">
          <div className="auth-logo">
            <div className="auth-logo-icon">צ</div>
            <div className="auth-app-name">GROW Pushka</div>
          </div>
          <p className="auth-tagline">Your digital tzedakah box</p>
          <div className="auth-howit">
            Drop coins · Fill your pushka · Donate to Jewish Greenbush Chabad
          </div>

          {s.authError && (
            <div className="auth-error" style={s.authError.startsWith('Password reset email sent') ? { background: '#dcfce7', borderColor: '#16a34a', color: '#14532d', whiteSpace: 'pre-line', fontWeight: 600, fontSize: '15px' } : {}}>
              {s.authError}
            </div>
          )}

          <div id={isNew ? 'google-btn-signup' : 'google-btn-signin'} className="google-btn-container" />

          <div className="auth-or"><span>or</span></div>

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
              placeholder={isNew ? 'Create a password (min 8 chars)' : 'Password'}
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
          {!isNew && (
            <button className="auth-guest" style={{ marginBottom: 4 }} onClick={async () => {
              if (!s.authEmail.trim()) return set({ authError: 'Enter your email above first' })
              await supabase.auth.resetPasswordForEmail(s.authEmail, { redirectTo: `${window.location.origin}?type=recovery` })
              set({ authError: 'Password reset email sent to ' + s.authEmail + '!\n\nDon\'t see it? Check your spam/junk folder — it sometimes lands there.' })
            }}>
              Forgot password?
            </button>
          )}
          <button className="auth-guest" onClick={() => set({ screen: 'home' })}>
            Browse without account
          </button>
        </div>
      </div>
    )
  }

  // ── VERIFY EMAIL SCREEN ──
  if (s.screen === 'reset-password') return (
    <div className="app forest-bg">
      <div className="auth-screen">
        <div className="auth-logo">
          <div className="auth-logo-icon"><LockIcon size={30} /></div>
          <div className="auth-app-name">GROW Pushka</div>
        </div>
        <h1 className="auth-title">Set New Password</h1>
        <p className="auth-sub" style={{ marginBottom: 24 }}>Choose a new password for your account.</p>
        {s.authError && <div className="auth-error">{s.authError}</div>}
        <div className="auth-form">
          <input className="field-input auth-input" type="password" placeholder="New password (min 8 chars)"
            value={s.authPassword} onChange={e => set({ authPassword: e.target.value })} />
          <input className="field-input auth-input" type="password" placeholder="Confirm new password"
            value={s.authPassword2 || ''} onChange={e => set({ authPassword2: e.target.value })} />
          <button className="cta-btn auth-btn" disabled={s.authLoading} onClick={async () => {
            if (s.authPassword.length < 8) return set({ authError: 'Password must be at least 8 characters' })
            if (s.authPassword !== s.authPassword2) return set({ authError: 'Passwords do not match' })
            set({ authLoading: true, authError: '' })
            const { error } = await supabase.auth.updateUser({ password: s.authPassword })
            if (error) { set({ authLoading: false, authError: error.message }) }
            else { set({ authLoading: false, screen: 'home', authPassword: '', authPassword2: '' }) }
          }}>
            {s.authLoading ? '...' : 'Set New Password'}
          </button>
        </div>
      </div>
    </div>
  )

  if (s.screen === 'verify-email') return (
    <div className="app forest-bg">
      <div className="auth-screen">
        <div className="auth-logo">
          <div className="auth-logo-icon"><MailIcon size={30} /></div>
          <div className="auth-app-name">GROW Pushka</div>
        </div>
        <h1 className="auth-title">Check Your Email</h1>
        <p className="auth-sub">We sent a confirmation link to</p>
        <div style={{ color: '#1a2a5e', fontWeight: 700, fontSize: 15, marginBottom: 24, textAlign: 'center' }}>
          {s.authEmail}
        </div>
        <div className="glass-card" style={{ width: '100%', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--teal)', marginBottom: 12 }}><MailIcon size={40} /></div>
          <p style={{ color: '#1a2a5e', fontSize: 14, lineHeight: 1.7, fontWeight: 500 }}>
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
      <Menu menuOpen={s.menuOpen} user={s.user} set={set} onSignOut={handleSignOut} />
      <Nav title={`${s.user?.user_metadata?.full_name?.split(' ')[0] || 'My'}'s Pushka`} shareToast={s.shareToast} set={set} prestige={s.prestige} streak={s.streak} prestigeNext={s.prestigeNext} prestigeAtMax={s.prestigeAtMax} totalPersonal={s.totalPersonal} />
      <div className="success-screen">
        <div className="success-glow"><SparkleIcon size={64} /></div>
        <h1 className="success-title">Thank You!</h1>
        <p className="success-sub">Your ${s.lastDonation} donation was received</p>
        <p className="success-msg">{successMsg.current}</p>
        <div className="glass-card impact-card">
          <div className="stat-label">JEWISH GREENBUSH CHABAD</div>
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
      <Menu menuOpen={s.menuOpen} user={s.user} set={set} onSignOut={handleSignOut} />
      <Nav title="History" shareToast={s.shareToast} set={set} />
      <div className="page-content">
        <div className="glass-card">
          <div className="card-title">Donation History</div>
          {s.allDonations.length === 0 ? (
            <p style={{ color: 'var(--cream)', opacity: 0.6, textAlign: 'center', padding: '16px 0' }}>No donations yet</p>
          ) : s.allDonations.map((d) => (
            // FIX #19 — use stable d.id instead of array index
            <div key={d.id || d.date + d.amount} className="history-row">
              <div>
                <div className="history-label">{d.label}</div>
                <div className="history-date">{d.date}{d.notes ? ` · "${d.notes}"` : ''}</div>
              </div>
              <div className="history-amount">${d.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── CHECKOUT SCREEN ──
  if (s.screen === 'checkout') return (
    <div className="app forest-bg">
      {paymentModal}
      <Menu menuOpen={s.menuOpen} user={s.user} set={set} onSignOut={handleSignOut} />
      <Nav title="Donate" shareToast={s.shareToast} set={set} />
      <div className="page-content">
        <button className="back-link" onClick={() => set({ screen: 'home' })}>← Back</button>

        {s.pushkaBalance >= s.pushkaGoal && (
          <div className="full-banner">
            <div>Your pushka is full with ${s.pushkaBalance.toFixed(2)}!</div>
            <button className="full-banner-change" onClick={() => set({ screen: 'settings' })}>Change Goal instead</button>
          </div>
        )}

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

        <div className="cause-label">Where should your donation go?</div>
        <div className="cause-pills">
          {CAUSES.map(c => {
            const CauseIcon = CAUSE_ICONS[c.id]
            return (
              <button
                key={c.id}
                className={`cause-pill ${s.donationCause === c.id ? 'active' : ''}`}
                onClick={() => set({ donationCause: c.id })}
              >
                {CauseIcon && <CauseIcon size={14} />} {c.name}
              </button>
            )
          })}
        </div>

        <PhotoStrip />

        <div style={{marginTop: 12}}>
          <div className="cause-label">Add a note (optional)</div>
          <textarea
            className="field-input"
            placeholder="e.g. In memory of, In honor of, special message..."
            value={s.donationNote || ''}
            onChange={e => set({ donationNote: e.target.value })}
            style={{width:'100%', minHeight:70, marginTop:6, fontSize:13, resize:'vertical'}}
          />
        </div>

        <div className="zelle-tip">
          <strong>Tip:</strong> Paying with Zelle means 100% of your donation goes directly to Jewish Greenbush Chabad — no fees taken out. Every dollar makes a difference!
        </div>

        <div className="payment-tabs">
          <button
            className={`payment-tab ${s.paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => set({ paymentMethod: 'card' })}
          ><CardIcon size={14} /> Card / Apple Pay</button>
          <button
            className={`payment-tab ${s.paymentMethod === 'zelle' ? 'active' : ''}`}
            onClick={() => set({ paymentMethod: 'zelle' })}
          ><BankIcon size={14} /> Zelle</button>
        </div>

        {s.paymentMethod === 'card' ? (
          <>
            {s.checkoutError && <div className="auth-error">{s.checkoutError}</div>}
            <button
              className="quick-give-btn pay-now-btn"
              onClick={() => {
                const amt = parseFloat(s.customAmount)
                if (!amt || amt < 1) return set({ checkoutError: 'Please enter an amount to donate' })
                set({ pendingPayment: amt, checkoutError: '' })
                handleCheckout(amt)
              }}
              disabled={s.checkoutLoading}
            >
              {s.checkoutLoading ? 'Opening payment...' : `DONATE${s.customAmount ? ` $${parseFloat(s.customAmount).toFixed(2)}` : ''}`}
            </button>
            <div className="stripe-badge">
              <LockIcon size={12} />
              <span>Powered by</span>
              <span className="stripe-word">Stripe</span>
            </div>
          </>
        ) : (
          <div className="zelle-card glass-card">
            <div className="zelle-logo">Zelle</div>
            <p className="zelle-instruction">Send your donation to:</p>
            <div className="zelle-phone">{ZELLE_PHONE}</div>
            <a
              href="https://www.zellepay.com/"
              className="zelle-open-btn"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                const deepLink = `zelle://send?amount=${s.customAmount || ''}`
                window.location.href = deepLink
                setTimeout(() => {
                  window.open('https://www.zellepay.com/', '_blank')
                }, 1500)
                e.preventDefault()
              }}
            >
              Open Zelle App
            </a>
            <p className="zelle-note">Or open your banking app → Zelle → send to the number above</p>
            {s.customAmount && parseFloat(s.customAmount) > 0 && (
              <div className="zelle-amount-remind">Amount: <strong>${parseFloat(s.customAmount).toFixed(2)}</strong></div>
            )}
            {/* FIX #9 — require confirmation before recording Zelle donation */}
            <button
              className="quick-give-btn pay-now-btn"
              style={{ marginTop: 16 }}
              onClick={() => {
                const amt = parseFloat(s.customAmount)
                if (!amt || amt < 1) return set({ checkoutError: 'Please enter an amount above $1' })
                const confirmed = window.confirm(
                  `Please confirm you sent $${amt.toFixed(2)} via Zelle to ${ZELLE_PHONE}.\n\nThis will be recorded as pending and verified by our team.`
                )
                if (!confirmed) return
                saveDonation(amt, 'zelle')
                set({ pendingPayment: amt })
                resetPushka()
              }}
            >
              I SENT IT
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (s.screen === 'faq') {
    const faqs = [
      { q: 'What is a pushka?', a: 'A pushka (פושקה) is a charity box — a traditional Jewish practice of setting aside money for tzedakah (charity). This app is your digital pushka, letting you fill it up a little at a time and donate to Jewish Greenbush Chabad.' },
      { q: 'How does dropping coins work?', a: 'Tap a donation amount on the home screen and watch the coin fall into your pushka. Your balance grows each time. Once you reach your goal, you\'ll be prompted to donate the full amount to Jewish Greenbush Chabad.' },
      { q: 'Does money leave my account when I drop a coin?', a: 'No! Dropping coins is just tracking your intention. No money moves until you press Pay Now and complete the Stripe payment or send via Zelle.' },
      { q: 'What is the streak?', a: 'Your streak counts how many days in a row you\'ve added to your pushka. Miss a day and it resets to zero. It\'s a fun way to build a daily tzedakah habit!' },
      { q: 'What are the levels?', a: 'Levels are earned by your total lifetime donations. You start as Prophetess Level, then reach Sarah ($180), Miriam ($360), Devorah ($540), Chana ($770), Chulda ($1200), and finally Esther ($1800). Tap the level badge at the top to see your progress.' },
      { q: 'What is recurring donation?', a: 'Turn on recurring in Settings and coins will automatically be added to your pushka every day, week, month, or every Erev Shabbat — without you having to do anything. Just open the app and the coins appear.' },
      { q: 'How do I set my own goal?', a: 'On the home screen, tap "Change Goal" below the progress bar and pick from the preset amounts or type your own.' },
      { q: 'How do I pay / donate?', a: 'Once your pushka has a balance, tap Pay Now. You can pay by credit card (secure, via Stripe) or send via Zelle. 100% of your donation goes to Jewish Greenbush Chabad.' },
      { q: 'Where does my donation go?', a: 'You choose! When you go to pay, you can direct your donation to: Where Most Needed, Scholarships, New Wing Campaign, Esther\'s Kitchen, or the Levels Campaign.' },
      { q: 'Is my payment secure?', a: 'Yes. Card payments are processed by Stripe, one of the world\'s most trusted payment platforms. We never store your card details.' },
      { q: 'Is my donation tax-deductible?', a: 'Yes! Jewish Greenbush Chabad is a registered 501(c)(3) nonprofit. Donations are tax-deductible to the extent permitted by law.' },
      { q: 'Can I use the app without an account?', a: 'Yes! You can drop coins and build a balance as a guest. However, signing in syncs your data across devices and enables email reminders.' },
      { q: 'How do I delete my account?', a: 'Go to Settings → scroll to the bottom → tap Delete My Account. This permanently deletes all your data immediately.' },
    ]
    return (
      <div className="app forest-bg">
        <Menu menuOpen={s.menuOpen} user={s.user} set={set} onSignOut={handleSignOut} />
        <Nav title="FAQ" shareToast={s.shareToast} set={set} prestige={s.prestige} streak={s.streak} prestigeNext={s.prestigeNext} prestigeAtMax={s.prestigeAtMax} totalPersonal={s.totalPersonal} />
        <div className="page-content">
          <div className="glass-card" style={{ marginBottom: 8 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><QuestionIcon size={17} /> Frequently Asked Questions</div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Everything you need to know about your pushka.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
          <button className="settings-chip signout-chip" onClick={() => set({ screen: 'home' })} style={{ width: '100%', marginTop: 8 }}>Back to Pushka</button>
        </div>
      </div>
    )
  }

  // ── SETTINGS SCREEN ──
  if (s.screen === 'settings') return (
    <div className="app forest-bg">
      <Menu menuOpen={s.menuOpen} user={s.user} set={set} onSignOut={handleSignOut} />
      <Nav title="Settings" shareToast={s.shareToast} set={set} />
      <div className="page-content">

        <div className="glass-card settings-card">
          <div className="settings-section-title"><UserIcon size={17} /> Account</div>
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

        <div className="glass-card settings-card">
          <div className="settings-section-title"><RefreshIcon size={17} /> Recurring Donations</div>
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
                  {[1, 5, 18, 36, 54, 72].map(amt => (
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
                  {['daily', 'weekly', 'monthly', 'shabbat'].map(f => (
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
                ${s.recurringAmount} will be added to your pushka {s.recurringFrequency === 'weekly' ? 'every week' : s.recurringFrequency === 'monthly' ? 'every month' : 'every Erev Shabbat'} — we'll remind you when it's due
                {!s.user && ' (sign in to save this setting)'}
              </div>
            </>
          )}
        </div>

        <div className="glass-card settings-card">
          <div className="settings-section-title"><CardIcon size={17} /> Pay Reminder When Full</div>
          <p className="settings-desc">When your pushka hits the target, we'll open the payment screen for you automatically.</p>

          <div className="setting-row">
            <div>
              <div className="setting-label">Auto-open checkout when full</div>
              <div className="setting-sub">Jumps to payment screen when balance hits ${s.pushkaGoal}</div>
            </div>
            <button
              className={`toggle ${s.autoPayEnabled ? 'on' : ''}`}
              onClick={() => set({ autoPayEnabled: !s.autoPayEnabled })}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          {s.autoPayEnabled && (
            <div className="settings-notice">
              Payment screen opens automatically when your pushka hits ${s.pushkaGoal}
            </div>
          )}
        </div>

        <div className="glass-card settings-card">
          <div className="settings-section-title"><BellIcon size={17} /> Reminders</div>
          <p className="settings-desc">Get a notification reminding you to drop coins into your pushka — no automatic charges, just a friendly nudge.</p>
          {s.reminderError && (
            <div
              className="auth-error"
              style={s.reminderError.startsWith('Reminders on') ? { background: '#dcfce7', borderColor: '#16a34a', color: '#14532d', marginBottom: 8 } : { marginBottom: 8 }}
            >
              {s.reminderError}
            </div>
          )}

          <div className="setting-row">
            <div>
              <div className="setting-label">Reminders</div>
              <div className="setting-sub">Every day at 9:00 AM</div>
            </div>
            <button
              className={`toggle ${s.reminderEnabled ? 'on' : ''}`}
              onClick={async () => {
                const enabling = !s.reminderEnabled
                set({ reminderEnabled: enabling, reminderError: '' })
                if (!enabling) return
                try {
                  if (typeof Notification === 'undefined') {
                    set({ reminderError: "This device doesn't support push notifications, but we'll still email you." })
                    return
                  }
                  if (Notification.permission === 'denied') {
                    set({ reminderEnabled: false, reminderError: 'Notifications are blocked. Enable them in your device settings.' })
                    return
                  }
                  let permission = Notification.permission
                  if (permission === 'default') {
                    permission = await Notification.requestPermission().catch(() => 'default')
                  }
                  if (permission === 'granted') {
                    const result = await subscribeToPush(s.user?.id)
                    set({ reminderError: result?.ok ? 'Reminders on — you\'ll get real notifications on this device.' : (result?.reason || 'Reminders on, but push may not work on this device — email reminders will still work.') })
                  } else {
                    set({ reminderError: "Notification permission wasn't granted — we'll still email you." })
                  }
                } catch (e) {
                  set({ reminderError: e?.message || 'Something went wrong turning on notifications.' })
                }
              }}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          {s.reminderEnabled && (
            <div className="settings-notice">
              You'll get a reminder every day at 9:00 AM — plus a special nudge on Erev Shabbat and when your pushka is full
            </div>
          )}
        </div>

        <div className="glass-card settings-card">
          <div className="settings-section-title"><CandleFlameIcon size={17} /> Yahrtzeit Reminders</div>
          <p className="settings-desc">Add a loved one's name and Hebrew date — we'll send you a reminder to donate l'ilui nishmatan every year on their yahrtzeit.</p>

          {s.yahrtzeits.map(yz => (
            <div key={yz.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{yz.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{yz.hebrew_day} {['','Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar II'][yz.hebrew_month]}</div>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}
                onClick={async () => {
                  await supabase.from('yahrtzeits').delete().eq('id', yz.id)
                  setS(prev => ({ ...prev, yahrtzeits: prev.yahrtzeits.filter(y => y.id !== yz.id) }))
                }}
              >×</button>
            </div>
          ))}

          {s.user ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Her/his name"
                  value={s.yahrtzeitDraft.name}
                  onChange={e => set({ yahrtzeitDraft: { ...s.yahrtzeitDraft, name: e.target.value } })}
                  style={{ flex: 1, minWidth: 120, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }}
                />
                <select
                  value={s.yahrtzeitDraft.month}
                  onChange={e => set({ yahrtzeitDraft: { ...s.yahrtzeitDraft, month: Number(e.target.value) } })}
                  style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', color: 'var(--text)', fontSize: 13 }}
                >
                  {['Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar'].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={s.yahrtzeitDraft.day}
                  onChange={e => set({ yahrtzeitDraft: { ...s.yahrtzeitDraft, day: Number(e.target.value) } })}
                  style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', color: 'var(--text)', fontSize: 13, width: 60 }}
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button
                className="settings-chip active"
                disabled={s.yahrtzeitSaving || !s.yahrtzeitDraft.name.trim()}
                style={{ marginTop: 10, width: '100%', padding: '10px', justifyContent: 'center' }}
                onClick={async () => {
                  if (!s.yahrtzeitDraft.name.trim()) return
                  set({ yahrtzeitSaving: true })
                  const { data, error } = await supabase.from('yahrtzeits').insert({
                    user_id: s.user.id,
                    name: s.yahrtzeitDraft.name.trim(),
                    hebrew_day: s.yahrtzeitDraft.day,
                    hebrew_month: s.yahrtzeitDraft.month,
                  }).select().single()
                  if (!error && data) {
                    setS(prev => ({ ...prev, yahrtzeits: [...prev.yahrtzeits, data], yahrtzeitDraft: { name: '', day: 7, month: 3 }, yahrtzeitSaving: false }))
                  } else {
                    set({ yahrtzeitSaving: false })
                  }
                }}
              >
                {s.yahrtzeitSaving ? 'Saving…' : '+ Add Yahrtzeit Reminder'}
              </button>
            </div>
          ) : (
            <p className="settings-desc" style={{ marginTop: 10 }}>Sign in to save yahrtzeit reminders.</p>
          )}
        </div>

        <div className="glass-card settings-card">
          <div className="settings-section-title"><TargetIcon size={17} /> Pushka Goal</div>
          <p className="settings-desc">Set your personal target for this pushka.</p>
          <div className="setting-row" style={{ marginTop: 8 }}>
            <div className="setting-label">Goal amount</div>
            <div className="settings-amount-row">
              {[90, 180, 360, 500, 1000].map(amt => (
                <button
                  key={amt}
                  className={`settings-chip ${s.pushkaGoal === amt ? 'active' : ''}`}
                  onClick={() => changeGoal(amt)}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row" style={{ marginTop: 12 }}>
            <div className="setting-label">Custom amount</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                className="goal-custom-input"
                placeholder="$ amount"
                min="1"
                style={{ width: 90 }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = parseFloat(e.target.value)
                    if (v > 0) { changeGoal(v); e.target.value = '' }
                  }
                }}
              />
              <button
                className="settings-chip active"
                style={{ padding: '4px 14px' }}
                onClick={e => {
                  const input = e.target.closest('.setting-row').querySelector('input')
                  const v = parseFloat(input.value)
                  if (v > 0) { changeGoal(v); input.value = '' }
                }}
              >Set</button>
            </div>
          </div>
        </div>

        <div className="glass-card settings-card">
          <div className="settings-section-title"><PaletteIcon size={17} /> Pushka Appearance</div>
          <p className="settings-desc">Choose a material for your pushka.</p>
          <div className="pushka-theme-picker">
            {[
              { id: 'pearl', label: 'Classic Pearl', swatch: 'linear-gradient(135deg, #ffffff, #d8dde5)' },
              { id: 'silver', label: 'Polished Silver', swatch: 'linear-gradient(135deg, #ffffff, #8b93a0)' },
              { id: 'brass', label: 'Classic Brass', swatch: 'linear-gradient(135deg, #fff3c4, #8a611a)' },
              { id: 'wood', label: 'Etched Wood', swatch: 'linear-gradient(135deg, #a9713d, #4a2c10)' },
              { id: 'matte-navy', label: 'Matte Navy', swatch: '#16233f' },
              { id: 'matte-sage', label: 'Matte Sage', swatch: '#55704f' },
            ].map(theme => (
              <button
                key={theme.id}
                className={`pushka-theme-swatch ${s.pushkaTheme === theme.id ? 'active' : ''}`}
                onClick={() => set({ pushkaTheme: theme.id })}
                title={theme.label}
              >
                <span className="pushka-theme-swatch-circle" style={{ background: theme.swatch }} />
                <span className="pushka-theme-swatch-label">{theme.label}</span>
              </button>
            ))}
          </div>

          <p className="settings-desc" style={{ marginTop: 18 }}>Add a personal dedication to your pushka (optional).</p>
          <input
            type="text"
            className="goal-custom-input"
            style={{ width: '100%' }}
            placeholder="e.g. In memory of... / For health & success"
            maxLength={40}
            value={s.pushkaDedication}
            onChange={e => set({ pushkaDedication: e.target.value })}
          />
        </div>

        <div className="glass-card settings-card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <div className="settings-section-title"><TrashIcon size={17} /> Reset Pushka</div>
          <p className="settings-desc">Empty your pushka and start fresh. This clears your balance and coins but keeps your donation history.</p>
          <button
            className="settings-chip"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', marginTop: 8, width: '100%', padding: '12px', justifyContent: 'center' }}
            onClick={() => {
              if (!window.confirm('Empty your pushka? Your balance and coins will be cleared.')) return
              set({ pushkaBalance: 0, pileCoins: [], pendingPayment: 0 })
            }}
          >
            Empty Pushka
          </button>
        </div>

        <div className="glass-card settings-card">
          <div className="settings-section-title"><DocumentIcon size={17} /> Legal &amp; Support</div>
          <a href="/privacy" target="_blank" rel="noreferrer" style={{ display: 'block', color: 'var(--gold)', padding: '10px 0', fontSize: 14, borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/support" target="_blank" rel="noreferrer" style={{ display: 'block', color: 'var(--gold)', padding: '10px 0', fontSize: 14, textDecoration: 'none' }}>Support</a>
        </div>

        {s.user && (
          <div className="glass-card settings-card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
            <div className="settings-section-title" style={{ color: '#f87171' }}><AlertTriangleIcon size={17} /> Delete Account</div>
            <p className="settings-desc">Permanently delete your account and all data. This cannot be undone.</p>
            <button
              className="settings-chip"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', marginTop: 8, width: '100%', padding: '12px', justifyContent: 'center' }}
              onClick={async () => {
                if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) return
                try {
                  const { data: { session } } = await supabase.auth.getSession()
                  await fetch('/api/delete-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                    body: JSON.stringify({ user_id: s.user.id }),
                  })
                } catch {}
                await supabase.auth.signOut()
                localStorage.removeItem('pushka_state')
                cloudLoadedRef.current = false
                set({ user: null, pushkaBalance: 0, pileCoins: [], pendingPayment: 0, donations: [], streak: 0, totalPersonal: 0, ...getPrestige(0) })
              }}
            >
              Delete My Account
            </button>
          </div>
        )}

      </div>
    </div>
  )

  // ── ADMIN SCREEN ──
  // FIX #1 — admin access gated by email only (no client-side password); RLS restricts DB access
  if (s.screen === 'admin' && s.user?.email !== 'adlaber@gmail.com') {
    return <div className="app forest-bg"><Menu menuOpen={s.menuOpen} user={s.user} set={set} onSignOut={handleSignOut} /><Nav title="Admin" shareToast={s.shareToast} set={set} /><div className="page-content"><div className="glass-card" style={{textAlign:'center',padding:32}}><div style={{display:'flex',justifyContent:'center',color:'var(--muted)'}}><LockIcon size={40} /></div><div className="card-title" style={{marginTop:12}}>Access Denied</div></div></div></div>
  }
  if (s.screen === 'admin') {
    // FIX #14 — query is now in a useEffect above, not inline here
    const allDonations = s.dbDonations || []
    const donations = allDonations.filter(d => d.status === 'confirmed')
    const pendingDonations = allDonations.filter(d => d.status === 'pending_verification')

    const verifyDonation = async (id) => {
      const { error } = await supabase.from('donations').update({ status: 'confirmed' }).eq('id', id)
      if (error) { alert('Failed to verify: ' + error.message); return }
      set({ dbDonations: allDonations.map(d => d.id === id ? { ...d, status: 'confirmed' } : d) })
    }
    const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0)
    const cardDonations = donations.filter(d => d.method === 'card')
    const zelleDonations = donations.filter(d => d.method === 'zelle')

    return (
      <div className="app forest-bg">
        <Menu menuOpen={s.menuOpen} user={s.user} set={set} onSignOut={handleSignOut} />
        <Nav title="Admin" shareToast={s.shareToast} set={set} />
        <div className="page-content">

          <div className="admin-stats-grid">
            <div className="glass-card admin-stat">
              <div className="stat-label">TOTAL COLLECTED</div>
              <div className="stat-big">${totalDonations.toLocaleString()}</div>
            </div>
            <div className="glass-card admin-stat">
              <div className="stat-label">DONATIONS</div>
              <div className="stat-big">{donations.length}</div>
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

          <div className="glass-card settings-card">
            <div className="settings-section-title"><TargetIcon size={17} /> Community Goal</div>
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

          <div className="glass-card settings-card">
            <div className="settings-section-title"><LinkIcon size={17} /> Dashboards</div>
            {[
              { label: 'Stripe — View Payments', url: 'https://dashboard.stripe.com' },
              { label: 'Supabase — View Users', url: 'https://supabase.com/dashboard/project/lscundsuxujnhsclgssx' },
              { label: 'Vercel — Deployment', url: 'https://vercel.com/nechamalaber-rgbs-projects/grow-web' },
            ].map(({ label, url }) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="admin-link">
                {label}
              </a>
            ))}
          </div>

          <div className="glass-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              All Donations
              <button style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => set({ dbDonations: null })}>↻ Refresh</button>
            </div>
            {!s.dbDonations && <p style={{ color: 'var(--muted)', padding: '12px 0' }}>Loading...</p>}
            {donations.length === 0 && s.dbDonations && <p style={{ color: 'var(--muted)', padding: '12px 0' }}>No confirmed donations yet</p>}
            {donations.map((d, i) => (
              <div key={d.id || i} className="history-row">
                <div>
                  <div className="history-label">{d.label} <span style={{ color: d.method === 'zelle' ? '#4ade80' : 'var(--gold)', fontSize: 11 }}>({d.method})</span></div>
                  <div className="history-date">{d.user_email || 'Guest'} · {new Date(d.created_at).toLocaleDateString()}{d.notes ? ` · "${d.notes}"` : ''}</div>
                </div>
                <div className="history-amount">${Number(d.amount).toFixed(2)}</div>
              </div>
            ))}
            {pendingDonations.length > 0 && (
              <>
                <div style={{ fontSize: 12, color: '#ff8c69', fontWeight: 600, marginTop: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><ClockIcon size={13} /> Pending Verification</div>
                {pendingDonations.map((d, i) => (
                  <div key={d.id || i} className="history-row" style={{ opacity: 0.9, alignItems: 'center', gap: 10 }}>
                    <div>
                      <div className="history-label" style={{ color: '#ff8c69' }}>{d.label} <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: d.method === 'card' ? '#4ade80' : '#ff8c69' }}>({d.method === 'card' ? 'Card — already charged' : 'Zelle — check bank'})</span></div>
                      <div className="history-date">{d.user_email || 'Guest'} · {new Date(d.created_at).toLocaleDateString()}{d.notes ? ` · "${d.notes}"` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="history-amount" style={{ color: '#ff8c69' }}>${Number(d.amount).toFixed(2)}</div>
                      <button
                        onClick={() => verifyDonation(d.id)}
                        style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#2ea043', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        ✓ Verify
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="glass-card" style={{ marginTop: 16 }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Users & Pushka Activity
              <button style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => set({ dbUsers: null })}>↻ Refresh</button>
            </div>
            {!s.dbUsers && <p style={{ color: 'var(--muted)', padding: '12px 0' }}>Loading...</p>}
            {s.dbUsers?.length === 0 && <p style={{ color: 'var(--muted)', padding: '12px 0' }}>No users yet</p>}
            {s.dbUsers?.map((u, i) => (
              <div key={u.user_id || i} className="history-row">
                <div>
                  <div className="history-label">{u.full_name || u.email || 'Unknown'}</div>
                  <div className="history-date" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span>{u.email || 'No email'} ·</span>
                    <FireIcon size={11} /> <span>{u.streak || 0} streak ·</span>
                    <BellIcon size={11} style={{ opacity: u.reminder_enabled ? 1 : 0.35 }} />
                    {(() => {
                      if (!u.updated_at) return null
                      const last = new Date(u.updated_at)
                      const now = new Date()
                      const diffH = Math.floor((now - last) / 3600000)
                      const diffD = Math.floor(diffH / 24)
                      const dotColor = diffH < 24 ? '#4ade80' : diffD === 1 ? '#eab308' : '#c8ccd2'
                      const label = diffH < 1 ? 'active now' : diffH < 24 ? `${diffH}h ago` : diffD === 1 ? 'yesterday' : `${diffD}d ago`
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          · <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} /> {label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="history-amount">${Number(u.pushka_balance || 0).toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>of ${u.pushka_goal || 100}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="settings-chip signout-chip" onClick={() => set({ screen: 'home' })} style={{ width: '100%', marginTop: 8 }}>
            Back to Pushka
          </button>
        </div>
      </div>
    )
  }

  // ── HOME SCREEN ──
  return (
    <>
    <div className="app forest-bg">
      {paymentModal}
      <Menu menuOpen={s.menuOpen} user={s.user} set={set} onSignOut={handleSignOut} />
      <Nav title={`${s.user?.user_metadata?.full_name?.split(' ')[0] || 'My'}'s Pushka`} shareToast={s.shareToast} set={set} prestige={s.prestige} streak={s.streak} prestigeNext={s.prestigeNext} prestigeAtMax={s.prestigeAtMax} totalPersonal={s.totalPersonal} />

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
              Jewish Greenbush Chabad brings Jewish families together — Shabbos tables, holidays, youth programs, and more.
              This pushka helps make it all happen.
            </p>
            <div className="intro-what-we-do">
              <div className="intro-activity">Shabbos & holiday celebrations</div>
              <div className="intro-activity">GROW girls programs & retreats</div>
              <div className="intro-activity">Community events & family programs</div>
              <div className="intro-activity">Torah classes & Jewish education</div>
            </div>
            <div className="intro-steps">
              <div className="intro-step">
                <div className="intro-step-icon"><CoinIcon size={20} /></div>
                <div>
                  <div className="intro-step-title">Drop coins</div>
                  <div className="intro-step-sub">Tap any amount to add to your pushka</div>
                </div>
              </div>
              <div className="intro-step">
                <div className="intro-step-icon"><CardIcon size={20} /></div>
                <div>
                  <div className="intro-step-title">Fill it &amp; donate</div>
                  <div className="intro-step-sub">Pay when ready — 100% goes to Chabad</div>
                </div>
              </div>
            </div>
            <button className="intro-btn" onClick={() => set({ seenIntro: true, screen: 'signup' })}>
              Create Free Account
            </button>
            <button className="intro-skip" onClick={() => set({ seenIntro: true, screen: 'signin' })}>
              Already have an account? Sign in
            </button>
          </div>
        </div>
      )}

      <div className="page-content">

        {s.recurringDue && s.recurringEnabled && (
          <div className="recurring-banner">
            <div className="recurring-banner-text">
              <RefreshIcon size={14} /> Your {s.recurringFrequency === 'shabbat' ? 'Erev Shabbat' : s.recurringFrequency} donation of <strong>${s.recurringAmount}</strong> is ready!
            </div>
            <div className="recurring-banner-btns">
              <button className="recurring-yes" onClick={() => {
                set({ recurringDue: false })
                dropCoins(s.recurringAmount)
              }}>Drop Coins</button>
              <button className="recurring-skip" onClick={() => set({ recurringDue: false, lastRecurringDate: new Date().toISOString() })}>Skip</button>
            </div>
          </div>
        )}

        <div className="goal-strip">
          <div className="goal-strip-top">
            <span className="goal-strip-label">{s.user?.user_metadata?.full_name?.split(' ')[0] ? `${s.user.user_metadata.full_name.split(' ')[0]}'s` : 'My'} Pushka Goal</span>
            <span className="goal-strip-nums">
              ${Math.min(s.pushkaBalance, s.pushkaGoal).toFixed(2)}
              <span className="goal-strip-of"> / ${s.pushkaGoal.toLocaleString()}</span>
            </span>
          </div>
          <div className="progress-bar"><div className="progress-fill gold" style={{ width: pct(s.pushkaBalance, s.pushkaGoal) + '%' }} /></div>
          {(() => {
            const now = new Date()
            const deadline = s.pushkaDeadline ? new Date(s.pushkaDeadline + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth() + 1, 0)
            const daysLeft = Math.ceil((deadline - now) / 86400000)
            const remaining = Math.max(0, s.pushkaGoal - s.pushkaBalance)
            const goalReached = remaining <= 0
            const urgent = !goalReached && daysLeft <= 5
            const message = goalReached
              ? <>Goal reached!</>
              : daysLeft <= 0
                ? <><ClockIcon size={13} /> Final day &middot; ${remaining.toFixed(0)} to go</>
                : <>{urgent ? <FireIcon size={13} /> : <CalendarIcon size={13} />} {daysLeft}d left &middot; ${remaining.toFixed(0)} to go</>
            return (
              <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: urgent ? '#ff8c69' : 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {message}
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>by {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} <EditIcon size={10} /></span>
                  <input
                    type="date"
                    value={s.pushkaDeadline || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)}
                    min={now.toISOString().slice(0, 10)}
                    onChange={e => set({ pushkaDeadline: e.target.value })}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                </label>
              </div>
            )
          })()}
          {s.showGoalPicker ? (
            <div className="goal-picker">
              {[18, 36, 54, 100, 180, 360].map(amt => (
                <button key={amt} className={`goal-chip ${s.pushkaGoal === amt ? 'active' : ''}`} onClick={() => changeGoal(amt)}>${amt}</button>
              ))}
              <input type="number" className="goal-custom-input" placeholder="Custom $" min="1"
                onKeyDown={e => { if (e.key === 'Enter') { const v = parseFloat(e.target.value); if (v > 0) { changeGoal(v); e.target.value = ''; } } if (e.key === 'Escape') set({ showGoalPicker: false }); }} />
            </div>
          ) : (
            <button className="change-goal-link" onClick={() => set({ showGoalPicker: true })}>Change Goal</button>
          )}
        </div>

        {/* ── MEMORIAL ── */}
        <div style={{
          margin: '0 auto',
          maxWidth: '96%',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#080d18',
          border: '1px solid rgba(200,180,120,0.25)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', aspectRatio: '1288 / 758', overflow: 'hidden' }}>
            <img src="/raizel.jpg" alt="Raizel Blesofsky" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,13,24,0.85) 0%, transparent 40%)' }} />
            <div style={{ position: 'absolute', bottom: 8, left: 11, right: 11 }}>
              <div style={{ color: '#f0d080', fontSize: 13, fontWeight: 700, fontFamily: 'Georgia, serif' }}>לע״נ Raizel Blesofsky</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontFamily: 'sans-serif', marginTop: 1 }}>ז׳ סיון תשפ״ו · OBM · Age 23</div>
            </div>
          </div>
          <div style={{ padding: '10px 13px' }}>
            <button onClick={() => set({ screen: 'checkout', checkoutAmount: 18 })} style={{ background: 'linear-gradient(135deg, #c8922a, #f5c842)', color: '#1a0f00', border: 'none', borderRadius: 50, padding: '9px 0', fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif', cursor: 'pointer', width: '100%' }}>
              Give tzedakah in her memory
            </button>
          </div>
        </div>

        {/* ── PUSHKA VISUAL ── */}
        <div className="pushka-section">
          <div className="pushka-side left"><span>TARGET: ${s.pushkaGoal}</span></div>
          <div className="pushka-wrapper">

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

            <div className={`pushka-container theme-${s.pushkaTheme || 'pearl'}`}>
              <div className="pushka-slot-wrap">
                <div className="pushka-slot-base">
                  <div className="pushka-slot-hole" />
                </div>
                <div className="pushka-resting-coin" />
              </div>

              <div className="pushka-body">
                <div className="pushka-side-text pushka-side-text-left">כל הפותח יד</div>
                <div className="pushka-side-text pushka-side-text-right">
                  <span className="pushka-side-text-name">JEWISH GREENBUSH CHABAD</span>
                  <span className="pushka-side-text-tag">Tzedakah &middot; One Coin at a Time</span>
                </div>

                <div className="pushka-inner">
                  <div className="pushka-hebrew-stack">
                    <span className="pushka-hebrew-letter letter-1">צ</span>
                    <span className="pushka-hebrew-letter letter-2">ד</span>
                    <span className="pushka-hebrew-letter letter-3">ק</span>
                    <span className="pushka-hebrew-letter letter-4">ה</span>
                  </div>
                  <div className="pushka-sub">TZEDAKA</div>
                  {s.pushkaDedication && (
                    <div className="pushka-dedication">{s.pushkaDedication}</div>
                  )}
                </div>

                {[25, 50, 75].map(pct => (
                  <div
                    key={pct}
                    className={`pushka-milestone ${(Math.min(s.pushkaBalance, s.pushkaGoal) / s.pushkaGoal) * 100 >= pct ? 'reached' : ''}`}
                    style={{ bottom: `${(pct / 100) * 330}px` }}
                  >
                    <span className="pushka-milestone-label">{pct}%</span>
                    <span className="pushka-milestone-line" />
                  </div>
                ))}

                <div className="pushka-pile">
                  <div className="pile-sand" style={{ height: `${Math.max(35, Math.round((Math.min(s.pushkaBalance, s.pushkaGoal) / s.pushkaGoal) * 330))}px` }} />
                  {s.pileCoins.map(coin => {
                    const pos = PILE_POSITIONS[coin.posIdx]
                    if (!pos) return null
                    return (
                      <div
                        key={coin.id}
                        className="pile-coin-3d"
                        style={{
                          '--r': `${pos.r}deg`,
                          '--depth': (pos.y / 228).toFixed(2),
                          left: `${pos.x}px`,
                          bottom: `${pos.y}px`,
                          transform: `rotate(${pos.r}deg) scale(${pos.s})`,
                          zIndex: Math.floor(pos.y / 15) + 1,
                          animation: coin.isNew ? undefined : 'none',
                        }}
                      >
                        <span className="pile-coin-shine" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="pushka-side right"><span>CURRENT: ${Math.min(s.pushkaBalance, s.pushkaGoal).toFixed(2)}</span></div>
        </div>

        {s.thankYouAmount && (
          <div className="tysm-toast">
            <div className="tysm-emoji"><SparkleIcon size={22} /></div>
            <div className="tysm-text">{s.thankYouMsg?.text || 'Thank you so much!'}</div>
            <div className="tysm-sub">{s.thankYouMsg ? s.thankYouMsg.sub(s.thankYouAmount) : `$${s.thankYouAmount} dropped in — you're amazing`}</div>
          </div>
        )}

        {s.pushkaBalance >= s.pushkaGoal && (
          <div className="full-banner-home">
            <div className="full-banner-text">Pushka is full! Ready to donate?</div>
            <div className="full-banner-actions">
              <button className="full-banner-btn primary" onClick={() => set({ screen: 'checkout' })}>Donate Now</button>
              <button className="full-banner-btn" onClick={() => set({ screen: 'settings' })}>Change Goal</button>
            </div>
          </div>
        )}

        <div className="select-label-row">
          <span className="select-label">Choose an amount</span>
          <span className="custom-link" onClick={() => s.user ? set({ showHomeCustom: !s.showHomeCustom }) : set({ screen: 'signup' })}>Custom $</span>
        </div>
        {s.user && s.showHomeCustom && (
          <div className="home-custom-row">
            <span className="custom-dollar">$</span>
            <input className="custom-amount-input" type="number" min="1" placeholder="0" value={s.customAmount} onChange={e => set({ customAmount: e.target.value })} autoFocus />
            <button className="home-custom-btn" onClick={() => {
              const amt = parseFloat(s.customAmount)
              if (!amt || amt < 1) return
              set({ customAmount: '', showHomeCustom: false, lastCustomAmount: amt })
              dropCoins(amt)
            }}>Add</button>
          </div>
        )}
        {!s.user && (
          <button className="signin-prompt" onClick={() => set({ screen: 'signup' })}>
            <span>Create a free account to start donating</span>
          </button>
        )}
        <div className="amount-grid home-amounts">
          {[
            s.lastCustomAmount
              ? { amount: s.lastCustomAmount, label: 'Custom', hebrew: `+$${s.lastCustomAmount}` }
              : { amount: 1, label: 'Coin', hebrew: '+$1' },
            { amount: 10, label: 'Gift', hebrew: '+$10' },
            { amount: 36, label: 'Double', hebrew: '+$36' },
          ].map(opt => (
            <button key={opt.amount} className={`amount-card ${s.selectedAmount === opt.amount ? 'selected' : ''} ${s.isDropping ? 'dropping' : ''} ${!s.user ? 'locked' : ''}`}
              onClick={() => s.user ? dropCoins(opt.amount) : set({ screen: 'signin' })} title={!s.user ? 'Sign in to donate' : undefined}>
              <div className="amount-value">${opt.amount}</div>
              <div className="amount-add">{opt.hebrew}</div>
              <div className="amount-label">{opt.label}</div>
            </button>
          ))}
        </div>

        {s.pushkaBalance > 0 && (
          <button className="quick-give-btn pay-now-btn" onClick={() => set({ screen: 'checkout', pendingPayment: s.pushkaBalance, customAmount: String(parseFloat(s.pushkaBalance.toFixed(2))) })}>
            Donate ${s.pushkaBalance.toFixed(2)} to Jewish Greenbush Chabad
          </button>
        )}

        <div className="app-credit">
          Built by <a href="mailto:schneurlaber@gmail.com">Schneur Laber</a> · <a href="mailto:schneurlaber@gmail.com">schneurlaber@gmail.com</a>
        </div>
      </div>

    </div>

    {s.showAuthSheet && !s.user && (
      <div className="auth-sheet-overlay" onClick={() => set({ showAuthSheet: false })}>
        <div className="auth-sheet" onClick={e => e.stopPropagation()}>
          <button className="auth-sheet-close" onClick={() => set({ showAuthSheet: false })}>✕</button>
          <div className="auth-sheet-logo">
            <div className="imp-lid"><div className="imp-slot"></div></div>
            <div className="imp-body"><span>צ</span></div>
          </div>
          <div className="auth-sheet-title">Join My Grow Pushka</div>
          <div className="auth-sheet-sub">Track your tzedakah and donate to Jewish Greenbush Chabad</div>
          <button className="auth-sheet-btn primary" onClick={() => set({ showAuthSheet: false, screen: 'signup' })}>
            Create Free Account
          </button>
          <button className="auth-sheet-btn secondary" onClick={() => set({ showAuthSheet: false, screen: 'signin' })}>
            I already have an account
          </button>
        </div>
      </div>
    )}
    </>
  )
}
