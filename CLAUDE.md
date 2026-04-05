# Grow Pushka Web App — CLAUDE.md

## Project Overview

Digital tzedakah box (pushka) for **Chabad of East Greenbush / Jewish Greenbush Chabad**.

- **Live URL**: https://grow-web-eta.vercel.app
- **Stack**: React + Vite, single-file app (`src/App.jsx` + `src/App.css`)
- **Deployed on**: Vercel

---

## Deploy Command

```bash
vercel --prod --token vcp_4rVQrmgbmqem461mEabTw3KCauUmWJY3EvSbFmtNBhEoqvDckT0fX7OL --scope nechamalaber-rgbs-projects --yes
```

---

## Services & Credentials

| Service | Detail |
|---|---|
| Supabase project | qfvwhnhprpauxkjklohs.supabase.co |
| Supabase table | `user_data` (stores pushka balance, coins, streak, donations) |
| Payments | Stripe (subscription mode) |

---

## Branding Rules

- **Organization name**: "Jewish Greenbush Chabad" / "Chabad of East Greenbush"
  - Do NOT use "GROW" as the org name
- **GROW** refers specifically to the girls program — keep "GROW Girls", "GROW Shabbaton" etc. for girls program slides
- **Photo strip header**: "CHABAD OF EAST GREENBUSH"
- **Donate button**: "Donate to Jewish Greenbush Chabad"
- **Pushka body text**: צדקה / TZEDAKA
- **Fill it up section**: "Fill it up!" / "JEWISH GREENBUSH CHABAD"

---

## Pushka Visual — Coin Mechanics

- **Goal per pushka cycle**: $100 (not $180, not $1000)
- **Coin pile positions**: 66 PILE_POSITIONS total
- **Rows start at**: y=30 (above the 28px rounded bottom cap)
- **Stacked coins**: 34x22px oval; gold/silver/copper via:
  - `nth-child(3n+2)` — silver
  - `nth-child(7n+5)` — copper
  - default — gold
- **Falling coins**: 34x34px round gold

---

## App Structure & Screens

1. **Intro overlay** — shown first time only (tracked via `seenIntro` in localStorage)
2. **Home screen** — photo strip → pushka visual → status strip → donate buttons
3. **Pushka visual** — cylindrical CSS pushka; coin pile fills bottom-to-top as donations accumulate

### Screens
- `home` — main pushka view
- `checkout` — Stripe payment flow
- `success` — post-donation confirmation
- `history` — donation history
- `settings` — user settings
- `admin` — admin panel
- `signin` — authentication

---

## Pending / Known Issues

- **Supabase RLS** must be enabled on `user_data` table. Run:
  ```sql
  ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "users_own_data" ON user_data
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  ```
- **Google OAuth**: Not yet configured — needs Google Cloud Console credentials added to Supabase dashboard (Authentication → Providers → Google)
