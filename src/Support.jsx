export default function Support() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', color: '#1a1a2e', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Support</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>Jewish Greenbush Chabad — GROW Pushka App</p>

      <h2>Need Help?</h2>
      <p>We're here to help! Reach out to us and we'll get back to you as soon as possible.</p>

      <div style={{ background: '#f5f7ff', borderRadius: 12, padding: '20px 24px', margin: '24px 0' }}>
        <p style={{ margin: 0 }}><strong>Email:</strong> <a href="mailto:reminders@buildbitachon.org" style={{ color: '#3b6fd4' }}>reminders@buildbitachon.org</a></p>
        <p style={{ margin: '8px 0 0' }}><strong>Website:</strong> <a href="https://www.buildbitachon.org" style={{ color: '#3b6fd4' }}>www.buildbitachon.org</a></p>
      </div>

      <h2>Common Questions</h2>

      <h3>How do I reset my pushka?</h3>
      <p>Go to Settings → scroll to the bottom → tap "Empty Pushka."</p>

      <h3>How do I cancel a recurring donation?</h3>
      <p>Go to Settings → Recurring Donations → toggle it off.</p>

      <h3>How do I turn off reminders?</h3>
      <p>Go to Settings → Reminders → toggle off Daily Reminders.</p>

      <h3>How do I delete my account?</h3>
      <p>Go to Settings → scroll to the bottom → tap "Delete My Account." This will permanently erase your account and all associated data immediately.</p>

      <h3>My payment didn't go through — what do I do?</h3>
      <p>Please email us and include the date and amount of the attempted donation. We'll look into it right away.</p>

      <p style={{ marginTop: 40, color: '#888', fontSize: 13 }}>
        <a href="/privacy" style={{ color: '#3b6fd4' }}>Privacy Policy</a>
      </p>
    </div>
  )
}
