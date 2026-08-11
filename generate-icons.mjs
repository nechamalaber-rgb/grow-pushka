import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2a1c08"/>
      <stop offset="100%" stop-color="#0e0a04"/>
    </radialGradient>
    <radialGradient id="coinGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#fff8c0"/>
      <stop offset="20%" stop-color="#f5c030"/>
      <stop offset="55%" stop-color="#d4922a"/>
      <stop offset="80%" stop-color="#a06010"/>
      <stop offset="100%" stop-color="#7a4808"/>
    </radialGradient>
    <radialGradient id="bodyGrad" cx="30%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f5f0e8"/>
      <stop offset="100%" stop-color="#e8dfc8"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="rgba(0,0,0,0.6)"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>

  <!-- Subtle gold border glow -->
  <rect width="1024" height="1024" rx="220" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="6"/>

  <!-- Pushka slot top piece -->
  <rect x="362" y="260" width="300" height="72" rx="36" fill="#c8c8d0" filter="url(#shadow)"/>
  <rect x="362" y="260" width="300" height="72" rx="36" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
  <!-- Slot hole -->
  <rect x="437" y="287" width="150" height="22" rx="11" fill="#0a0a0a"/>
  <rect x="437" y="287" width="150" height="22" rx="11" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

  <!-- Pushka body -->
  <rect x="337" y="326" width="350" height="430" rx="40" fill="url(#bodyGrad)" filter="url(#shadow)"/>
  <rect x="337" y="326" width="350" height="430" rx="40" fill="none" stroke="rgba(200,185,160,0.6)" stroke-width="2"/>

  <!-- Hebrew text צדקה on the box -->
  <text x="512" y="470" text-anchor="middle" font-family="serif" font-size="110" font-weight="700" fill="#2a3560" opacity="0.9">צדקה</text>
  <text x="512" y="530" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" letter-spacing="10" fill="#8a92b0">TZEDAKA</text>

  <!-- GROW text at bottom of box -->
  <text x="512" y="710" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="900" letter-spacing="8" fill="rgba(140,110,50,0.55)">GROW</text>

  <!-- Falling coin -->
  <circle cx="512" cy="200" r="72" fill="url(#coinGrad)" filter="url(#glow)"/>
  <circle cx="512" cy="200" r="72" fill="none" stroke="rgba(255,220,70,0.5)" stroke-width="4"/>
  <circle cx="512" cy="200" r="58" fill="none" stroke="rgba(255,220,70,0.3)" stroke-width="2"/>
  <!-- Coin highlight -->
  <ellipse cx="494" cy="180" rx="22" ry="16" fill="rgba(255,255,255,0.4)" transform="rotate(-20, 494, 180)"/>
  <!-- Dollar sign on coin -->
  <text x="512" y="215" text-anchor="middle" font-family="sans-serif" font-size="56" font-weight="900" fill="rgba(90,48,0,0.65)">$</text>

  <!-- Gold glow under coin -->
  <ellipse cx="512" cy="272" rx="50" ry="8" fill="rgba(212,175,55,0.25)"/>

  <!-- Bottom label -->
  <text x="512" y="840" text-anchor="middle" font-family="sans-serif" font-size="38" font-weight="800" letter-spacing="4" fill="rgba(212,175,55,0.85)">PUSHKA</text>
</svg>`

const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732" width="2732" height="2732">
  <defs>
    <radialGradient id="sbg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#2a1c08"/>
      <stop offset="100%" stop-color="#0e0a04"/>
    </radialGradient>
    <radialGradient id="scoinGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#fff8c0"/>
      <stop offset="20%" stop-color="#f5c030"/>
      <stop offset="55%" stop-color="#d4922a"/>
      <stop offset="100%" stop-color="#7a4808"/>
    </radialGradient>
    <radialGradient id="sbodyGrad" cx="30%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f5f0e8"/>
      <stop offset="100%" stop-color="#e8dfc8"/>
    </radialGradient>
    <filter id="sshadow">
      <feDropShadow dx="0" dy="20" stdDeviation="40" flood-color="rgba(0,0,0,0.6)"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="2732" height="2732" fill="url(#sbg)"/>

  <!-- Pushka slot -->
  <rect x="966" y="860" width="800" height="190" rx="95" fill="#c8c8d0" filter="url(#sshadow)"/>
  <rect x="1116" y="914" width="500" height="60" rx="30" fill="#0a0a0a"/>

  <!-- Pushka body -->
  <rect x="896" y="1040" width="940" height="1000" rx="100" fill="url(#sbodyGrad)" filter="url(#sshadow)"/>

  <!-- Hebrew -->
  <text x="1366" y="1340" text-anchor="middle" font-family="serif" font-size="280" font-weight="700" fill="#2a3560" opacity="0.9">צדקה</text>
  <text x="1366" y="1430" text-anchor="middle" font-family="sans-serif" font-size="72" font-weight="700" letter-spacing="24" fill="#8a92b0">TZEDAKA</text>
  <text x="1366" y="1870" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="900" letter-spacing="20" fill="rgba(140,110,50,0.55)">GROW</text>

  <!-- Coin -->
  <circle cx="1366" cy="700" r="180" fill="url(#scoinGrad)" filter="url(#sshadow)"/>
  <circle cx="1366" cy="700" r="180" fill="none" stroke="rgba(255,220,70,0.5)" stroke-width="10"/>
  <ellipse cx="1318" cy="648" rx="55" ry="40" fill="rgba(255,255,255,0.4)" transform="rotate(-20,1318,648)"/>
  <text x="1366" y="756" text-anchor="middle" font-family="sans-serif" font-size="140" font-weight="900" fill="rgba(90,48,0,0.65)">$</text>

  <!-- App name -->
  <text x="1366" y="2280" text-anchor="middle" font-family="serif" font-size="120" font-weight="700" fill="rgba(212,175,55,0.9)" letter-spacing="6">GROW Pushka</text>
  <text x="1366" y="2360" text-anchor="middle" font-family="sans-serif" font-size="52" font-weight="500" fill="rgba(240,230,204,0.45)" letter-spacing="8">YOUR DIGITAL TZEDAKAH BOX</text>
</svg>`

// Make directories
mkdirSync('assets', { recursive: true })

// Write SVGs to temp files then convert
writeFileSync('assets/icon-source.svg', iconSvg)
writeFileSync('assets/splash-source.svg', splashSvg)

// Generate icon.png (1024x1024)
await sharp(Buffer.from(iconSvg))
  .resize(1024, 1024)
  .png()
  .toFile('assets/icon.png')
console.log('✅ icon.png generated (1024x1024)')

// Generate splash.png (2732x2732)
await sharp(Buffer.from(splashSvg))
  .resize(2732, 2732)
  .png()
  .toFile('assets/splash.png')
console.log('✅ splash.png generated (2732x2732)')

console.log('\nNow run: npx @capacitor/assets generate')
