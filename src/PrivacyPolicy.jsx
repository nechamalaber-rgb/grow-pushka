export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', color: '#1a1a2e', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>Jewish Greenbush Chabad — GROW Pushka App<br />Last updated: April 2026</p>

      <h2>1. Introduction</h2>
      <p>Jewish Greenbush Chabad ("we," "us," or "our") operates the GROW Pushka mobile and web application. This Privacy Policy explains how we collect, use, and protect your personal information when you use our app.</p>

      <h2>2. Information We Collect</h2>
      <p><strong>Account Information:</strong> When you create an account, we collect your name and email address.</p>
      <p><strong>Donation Data:</strong> We store records of donations you make through the app, including amounts and dates.</p>
      <p><strong>Usage Data:</strong> We collect data about how you use the app, including your pushka balance, streak, and settings preferences.</p>
      <p><strong>Payment Information:</strong> Payments are processed by Stripe. We do not store your credit card numbers or payment details — Stripe handles all payment processing securely.</p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account</li>
        <li>To process donations to Jewish Greenbush Chabad</li>
        <li>To send reminder emails if you opt in</li>
        <li>To display your donation history and streak</li>
        <li>To improve the app experience</li>
      </ul>

      <h2>4. Email Communications</h2>
      <p>If you enable reminders in Settings, we will send you periodic reminder emails. You can disable these at any time in the app under Settings → Reminders.</p>

      <h2>5. Data Sharing</h2>
      <p>We do not sell or rent your personal information to third parties. We share data only with:</p>
      <ul>
        <li><strong>Stripe</strong> — for payment processing</li>
        <li><strong>Supabase</strong> — for secure data storage and authentication</li>
        <li><strong>Resend</strong> — for sending reminder emails</li>
      </ul>

      <h2>6. Data Security</h2>
      <p>We use industry-standard security measures including encrypted connections (HTTPS) and secure authentication. Your data is stored on Supabase's secure infrastructure.</p>

      <h2>7. Children's Privacy</h2>
      <p>Our app is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>

      <h2>8. Your Rights</h2>
      <p>You may request to access, update, or delete your personal data at any time by contacting us. To delete your account and all associated data, contact us at the email below.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify users of significant changes via email or in-app notification.</p>

      <h2>10. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us:</p>
      <p><strong>Jewish Greenbush Chabad</strong><br />
      Email: <a href="mailto:reminders@buildbitachon.org" style={{ color: '#3b6fd4' }}>reminders@buildbitachon.org</a><br />
      Website: <a href="https://www.buildbitachon.org" style={{ color: '#3b6fd4' }}>www.buildbitachon.org</a></p>
    </div>
  )
}
