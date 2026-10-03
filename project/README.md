# FitSense AI 2.0 — Your Personal AI Fashion Assistant

A full-stack AI fashion platform: FastAPI backend + Next.js frontend, powered
by Google Gemini (chat, vision, OCR, voice), OpenWeatherMap (live weather),
and Hugging Face (outfit image generation).

Every feature listed in the original spec is implemented against a real
backend — no hardcoded/mock UI data remains. See `FEATURES.md` for the full
list and `MANUAL_TESTING_GUIDE.md` for a step-by-step way to verify all of it
yourself.

---

## 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then fill in keys — see below
uvicorn app.main:app --reload     # http://127.0.0.1:8000/docs
```

### Environment variables (`backend/.env`)

| Variable | Required? | What it powers | If left blank |
|---|---|---|---|
| `GEMINI_API_KEY` | Recommended | Stylist chat, outfit generation, computer vision, OCR, skin tone/body analysis, voice transcription & intent parsing | Every Gemini call falls back to a structured mock response — the app still runs and is fully clickable |
| `DATABASE_URL` | No | Where data is stored | Defaults to local SQLite (`sqlite:///./fitsense.db`) |
| `JWT_SECRET` | Yes for prod | Signs auth tokens | Ships with a dev default — **change this before deploying** |
| `WEATHER_API_KEY` | Recommended | Live weather in outfit generation, stylist recommendations, travel packing | Falls back to a simulated "Mild & Clear, 22°C" reading |
| `HUGGINGFACE_API_KEY` | Optional | Realistic outfit image generation | Recommendations still work, just without a generated photo |
| `CORS_ORIGINS` | No (prod only) | Extra allowed frontend origins, comma-separated | Only `localhost:3000`/`127.0.0.1:3000` are allowed — add your production domain here before deploying |

Get free keys:
- Gemini: https://aistudio.google.com
- OpenWeatherMap: https://openweathermap.org/api
- Hugging Face: https://huggingface.co/settings/tokens

### Production database (MySQL)

The app defaults to SQLite for local dev. For production, point
`DATABASE_URL` at MySQL — the driver (`pymysql`) is already in
`requirements.txt`:

```
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:3306/<database>
```

---

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local        # only needed if backend isn't on 127.0.0.1:8000
npm run dev                       # http://localhost:3000
```

### Environment variables (`frontend/.env.local`)

| Variable | Required? | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://127.0.0.1:8000/api` — override if your backend runs elsewhere |

---

## 3. First run

1. Start the backend, then the frontend.
2. Open `http://localhost:3000`, sign up with any email/password.
3. Add a few wardrobe items (Wardrobe → Add Item) — most features (analytics,
   outfit generation, planner, travel) work much better with a few real items
   in your closet.
4. To use the **Admin Dashboard**, promote your account to admin directly in
   the database (no signup flow grants this by design):
   ```bash
   cd backend
   python -c "
   from app.database import SessionLocal
   from app.models import User
   db = SessionLocal()
   u = db.query(User).filter(User.email=='you@example.com').first()
   u.role = 'admin'
   db.commit()
   "
   ```

See `MANUAL_TESTING_GUIDE.md` for a full click-through of every feature.

---

## 4. What's real vs. what to know

- **No mock UI data remains.** Every page you'll click through is wired to a
  real, authenticated backend endpoint, tested end-to-end.
- **Security**: every user-data endpoint (wardrobe, analytics, shopping,
  planner, travel, outfits, admin) requires a valid auth token and is scoped
  to the logged-in user — verified with a real two-user isolation test.
- **AI features degrade gracefully.** With no `GEMINI_API_KEY`, `WEATHER_API_KEY`,
  or `HUGGINGFACE_API_KEY` set, the app still runs fully — you'll just get
  structured fallback content instead of live AI output. This is intentional,
  so you (or a reviewer) can click through the whole app without any paid keys.
- **Admin Dashboard's model metrics** are computed from real user feedback
  (like/dislike/favorite on saved outfits), not simulated. With zero feedback
  in the database, it will honestly say "not enough data yet" rather than
  showing invented numbers.
- **Text-to-speech (`/api/voice/synthesize`)**: I could not verify this one
  specific endpoint end-to-end — my sandbox's network restrictions block
  reaching Microsoft's edge-tts servers, so `pytest` fails on that one test
  in an environment with no internet egress to `speech.platform.bing.com`.
  The code follows the standard `edge-tts` usage pattern and should work
  in a normal deployment with internet access; just flagging that I
  personally couldn't confirm it live.

Full detail on every feature and every bug found/fixed during development is
in `FEATURES.md`.
