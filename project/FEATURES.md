# FitSense AI 2.0 — Full Feature List

Every feature below is implemented against a real backend endpoint and a
real, wired-up frontend page — none of this is mock UI.

## Core Features (from spec)

| Feature | Frontend page | Backend endpoint(s) | AI/data source |
|---|---|---|---|
| Personal AI Stylist | `/dashboard/stylist` | `POST /api/stylist/chat` | Gemini |
| Smart Outfit Recommendation | `/dashboard/stylist`, dashboard home | `POST /api/stylist/recommend`, `POST /api/outfits/generate` | Gemini + rule-based ranking, personalized by skin tone/body shape |
| AI Wardrobe | `/dashboard/wardrobe` | `GET/POST/PATCH/DELETE /api/wardrobe/*` | Real CRUD, DB-backed |
| Computer Vision (garment scan) | `/dashboard/analysis` | `POST /api/analysis/scan` | Gemini Vision |
| Skin Tone & Body Analysis | `/dashboard/analysis`, `/dashboard/settings` | `POST /api/analysis/skin-tone`, `POST /api/analysis/body` | Gemini Vision — **results persist to your profile** and feed future outfit generation |
| Fashion Analytics | `/dashboard/analytics` | `GET /api/analytics/` | Real wardrobe value, cost-per-wear, color/category distribution |
| Smart Shopping Assistant | `/dashboard/shopping` | `GET/POST/DELETE /api/shopping/wishlist` | Real duplicate detection against your wardrobe |
| Travel Packing Assistant | `/dashboard/travel` | `POST /api/travel/generate`, `GET /api/travel/`, `PATCH /api/travel/{id}/pack` | Gemini + live weather auto-fetched from destination |
| Weekly Outfit Planner | `/dashboard/planner` | `GET/POST/DELETE /api/planner/*` | Real calendar; AI auto-generates the outfit from a single title input |
| AI Fashion Chatbot | `/dashboard/stylist` | `POST /api/stylist/chat` | Same engine as Stylist |
| Weather-Based Styling | throughout (stylist, outfits, travel) | `GET /api/outfits/weather` | OpenWeatherMap, live |
| Mood-Based Fashion | `/dashboard/stylist`, `/dashboard/planner` | mood param on `/outfits/generate` | Gemini |
| Outfit Rating | `/dashboard/analysis` | `POST /api/analysis/rate` | Gemini Vision — genuinely analyzes the uploaded photo |
| Recommendation Engine | background (all outfit surfaces) | `GET /api/predict/next-outfit` | Real DB-backed implicit preference learning from wear count + like/dislike feedback |
| Admin Dashboard | `/dashboard/admin` (role=admin only) | `GET /api/admin/*` | Real platform stats: users, signups, wardrobe totals, model health |
| Outfit Visualization | Stylist, Outfit Generator | auto-attached `outfit_image` field | Hugging Face FLUX.1-schnell |
| Voice Concierge | `/dashboard/voice` | `POST /api/voice/transcribe`, `/command`, `/synthesize` | Gemini transcription + intent parsing (grounded in real wardrobe for outfit/item requests) + edge-tts speech |
| OCR (label & receipt scan) | `/dashboard/scanner` | `POST /api/ocr/label`, `/receipt`, `/auto-fill` | Gemini Vision, with real duplicate detection on auto-fill |
| Personalization / Learning Profile | `/dashboard/personalization` | `GET/PUT /api/personalization/preferences`, `POST /api/personalization/feedback/outfit/{id}`, `GET /api/personalization/learning-profile` | Real implicit preference scoring from wardrobe + outfit feedback |

## Account & platform

- Signup/login with JWT auth, bcrypt password hashing
- Profile settings (style preference, budget, body shape, skin tone, gender) — real, persisted
- Every endpoint above requires authentication and is scoped to the logged-in user only

## Known, honest limitations (not hidden)

- **Notifications / Security / Appearance** settings tabs are placeholders — no backend concept exists yet for notification preferences or theme persistence.
- **Precision@K / Recall@K / mAP** on the Admin Dashboard are intentionally reported as unavailable — these require held-out ground-truth relevance labels this app has no mechanism to collect. What's shown instead ("Acceptance Rate") is a real, honestly-computed number from actual user feedback.
- The rule-based `/stylist/recommend` scorer doesn't yet use skin tone/body shape (only the Gemini-driven `/outfits/generate` path does). Both paths use live weather and real wardrobe data.
- FAISS/CLIP semantic embedding search (mentioned in the original tech-stack doc) isn't implemented — wardrobe search today is keyword-based (name/color/category/brand/material substring match), not vector similarity.

## Automated tests

`backend/tests/` has a real pytest suite (26 tests) covering stylist, outfits,
analysis, OCR, personalization, predictive, and voice endpoints. 25/26 pass in
a clean environment. The one failure (`test_voice_synthesize`) is a sandbox
network restriction in my dev environment blocking Microsoft's edge-tts
servers, not a code bug — see the README note under "What's real vs. what to
know". Run it yourself:

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

## Bugs found and fixed during development (for transparency)

1. **Critical**: Wardrobe, Analytics, and Shopping endpoints had no authentication — any user could read/edit/delete any other user's data by guessing an ID. Fixed and verified with a live two-user isolation test.
2. `/auth/profile/{user_id}` accepted a client-supplied user ID (IDOR) — fixed to derive the user from the auth token.
3. Planner endpoints accepted a client-supplied `user_id` — same fix.
4. The wardrobe "Add Item" form bypassed the API client with a hardcoded `http://127.0.0.1:8000` fetch and no auth header — fixed.
5. `passlib`/`bcrypt` version mismatch broke every signup/login on a fresh install (`bcrypt==5.0.0` incompatible with `passlib==1.7.4`) — pinned `bcrypt==4.0.1`.
6. Outfit Rating never actually sent the uploaded photo to Gemini (image bytes were silently dropped) — fixed.
7. Admin Dashboard's "Recommendation Engine Health" panel was 100% hardcoded fake numbers (`Precision@K: 0.82` etc., constants regardless of real data) — rebuilt to compute a genuine acceptance rate from real outfit feedback, real measured inference latency, and real drift detection.
8. Sustainability score ignored the real `material` field on every wardrobe item, always computing off `"Unknown"` — fixed to map real material data.
9. `/predict/next-outfit` used two hardcoded mock outfits ("Blue Jeans", "Black Dress") instead of the user's real wardrobe, and the underlying ranking function had an unscoped DB query that could pull in another user's item data — both fixed.
10. Voice assistant's "suggest an outfit" / "find an item" intents were parsed by Gemini but never actually executed — the spoken response was Gemini improvising with no connection to your real wardrobe. Fixed to genuinely query your wardrobe/outfit generator.
11. Skin tone and body shape analysis results were shown once and discarded — never saved, never used by outfit generation, despite being core to the spec's personalization promise. Fixed: scans now persist to your profile and feed into `/outfits/generate`.
12. Dashboard home page and Settings page were 100% hardcoded fake data (fake name, fake "95% Match", fake "items in the wash", a "Save Changes" button wired to nothing) — both rebuilt on real data.
13. Travel and Planner pages were fully decorative mockups with no backend calls at all — both rebuilt with real CRUD.
14. Found and removed a dead, orphaned `app/models/prediction.py` — a leftover file (not a valid Python package, no `__init__.py`) defining a confusingly similar but completely unused `UserPreference` model that nothing in the app ever imported. Left in place, it would have misled anyone reading the codebase into thinking it was the real preferences model.
15. **CORS was misconfigured**: `allow_origins` included `"*"` alongside `allow_credentials=True`, which browsers reject and which is bad practice regardless — a wildcard origin combined with credentialed requests would let any website make authenticated calls against this API. Replaced with an explicit allow-list (`localhost:3000`, `127.0.0.1:3000`, plus a `CORS_ORIGINS` env var for production domains).
16. **No warning if `JWT_SECRET` is left at its published default.** Anyone who reads the docs (or this file) knows the default value; a deployment that forgets to set a real one lets anyone forge valid login tokens for any user, including admins. The app now prints a loud startup warning if it detects the default is still in use.
17. **Zero rate limiting anywhere.** `/auth/login` could be brute-forced without limit, and every Gemini/OpenWeatherMap/Hugging-Face-calling endpoint could be hammered without limit — both a security issue and a cost-exhaustion risk. Added `slowapi`: a global 120/min/IP default, `10/min` on login, `10/hour` on signup, and `20/min` on every AI-calling endpoint. Verified live: 15 rapid login attempts produced 10×401 then 5×429.
18. **Signup accepted any password/email.** No minimum password length and `email: str` instead of `EmailStr` meant a 1-character password and a malformed email were both accepted. Fixed — verified both are now rejected with 422.
19. **API error messages leaked raw JSON** to the UI (`API 400: {"detail":"Email already registered."}`) instead of a clean message, and FastAPI's validation-error format (`detail` as an array of `{msg}` objects) wasn't handled at all, which the new password-length validation would have triggered constantly. Fixed the frontend API client to parse and surface clean messages for both cases.
20. **No working signup flow existed in the UI at all.** `authApi.signup` was defined in the API client but called from nowhere in the entire frontend. The actual click-path was: landing page → onboarding (a style picker with no auth calls) → "Continue" pushes to `/auth` → a login-only form → whose "Sign Up" link pointed back to `/onboarding`, an infinite loop. Nobody could ever create an account through the app's own UI, despite the backend signup endpoint working correctly (this is why it wasn't caught earlier — every prior signup test was a direct API call, not a browser click-through). Rebuilt `/auth` with a real Login/Signup toggle; onboarding's style picks now carry forward through signup via `sessionStorage` and get applied to the new profile immediately after account creation. Also fixed onboarding's "Skip" link, which pointed straight at `/dashboard` with no auth at all.
21. The login page's "Continue with Google" / "Continue with Apple" buttons had no `onClick` handler — clickable but silently did nothing. Changed to visibly disabled with a "coming soon" label rather than presenting fake working auth options.
