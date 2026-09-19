# AgriConnect — Prototype Build PRD (2-Person Team, Zero Budget)
**SIH26132 | For dev execution, not pitching**

This PRD is scoped for exactly what it says: two people, no budget, building a working prototype fast. It deliberately cuts scope harder than the original solution document — that doc was written for a 6-person team and a 36-hour hackathon floor; this one assumes two people doing real pre-hackathon build-up (Phase 1) and needs to survive contact with actual free-tier limits.

Where this PRD deviates from the original solution document's tech stack, it's called out explicitly with the reason — you can override any of these calls, but don't skip reading why.

---

## 1. Scope Lock — What This Prototype Actually Does

To keep two people from drowning, the prototype has **one critical path** that must work end-to-end, live, on a real phone. Everything else is secondary.

**Critical path (must work, no excuses):**
1. A farmer sends a WhatsApp message describing their crop, quantity, quality, and location.
2. The system extracts structured data from that message.
3. The system computes a net price and sell-now/hold recommendation using real Agmarknet data, and replies in the same WhatsApp thread.
4. A buyer, on a web dashboard, posts a demand (crop, quantity, quality, price).
5. The system matches the farmer's lot to that demand and shows it on the dashboard.
6. The buyer sends a digital offer; the farmer receives and can accept it on WhatsApp.
7. A transaction status tracker updates and is visible on both sides.

**Explicitly out of scope for the prototype (do not build these — you will run out of time):**
- Real payment gateway integration (status tracker only, no money movement)
- Logistics/storage marketplace (a hardcoded static list of 2–3 options per region is enough)
- ML-based quality grading from photos (a checklist form is enough)
- Dispute resolution backend (a single "flag" button that writes a status field is enough)
- Multi-language NLP beyond English + basic Hindi/Marathi crop-name recognition
- User authentication hardening, rate limiting, or production security work

If you find yourselves building anything not in the critical path list, stop and ask whether it's actually needed for the demo.

---

## 2. Recommended Free-Tier Stack (with reasoning)

The original solution document specifies Python/FastAPI + separate PostgreSQL + Next.js + Twilio, deployed across Vercel and Render/Railway. That's a reasonable stack for a 6-person team with dedicated backend/frontend/NLP roles. **For two people at zero cost, running two separate backend services (a Next.js frontend + a separate FastAPI service) is extra deployment surface you don't need.** Here's the adapted recommendation:

| Layer | Recommended (free) | Why |
|---|---|---|
| Frontend + backend | **Next.js 14 (App Router), deployed on Vercel free tier** | One codebase, one deploy target, API routes replace a separate FastAPI service. Removes an entire deployment (no Render/Railway needed, no cold-start issues). |
| Database + Auth + File storage | **Supabase free tier** (Postgres + Auth + Storage in one) | Free 500MB Postgres, built-in auth for buyer/admin login, built-in file storage for grading photos — three things you'd otherwise configure separately, for free, in one dashboard. |
| Farmer interface (WhatsApp) | **Twilio WhatsApp Sandbox** (free) | No WhatsApp Business API approval needed (that takes weeks and needs a registered business). Sandbox is explicitly built for exactly this use case — free, works instantly, only limitation is each demo phone must send a join code once. |
| NLP / structured extraction | **Groq API (Llama 3.1 8B/70B), free tier** | Free, generous rate limits, fast enough for a live demo reply, and supports JSON-mode-style structured output for slot extraction (crop, quantity, quality, location). Avoid OpenAI (paid) for this. |
| Price data | **Agmarknet via data.gov.in open API** (free, requires only a free API key signup) | Official government mandi price dataset, publicly documented, free registration at data.gov.in. |
| Distance / transport cost estimate | **OpenStreetMap Nominatim (geocoding) + OSRM (routing distance), both free, no key needed** | Avoids Google Maps API, which has usage costs beyond a small free credit. |
| Version control | **GitHub (free, private repo for 2 collaborators)** | Standard. |

**If your team strongly prefers to keep Python for the price-advisory logic** (e.g., pandas for moving averages), the alternative is: Next.js frontend on Vercel + a single FastAPI service on Render's free tier, calling out to it only for `/price-advisory` and `/nlp-extract`. This is viable but accept the tradeoff: Render's free tier sleeps after 15 minutes of inactivity, so the **first** request after idle time takes 30–50 seconds to wake up — rehearse your demo to account for this, or ping the service a few minutes before you present.

---

## 3. Data Model

Minimal schema — five tables, no more:

```
farmers
  id, phone_number, name (nullable), location_text, location_lat, location_lng, created_at

lots
  id, farmer_id (fk), crop, quantity_kg, quality_grade, location_lat, location_lng,
  status (open | matched | sold), created_at

buyers
  id, name, phone_or_email, verified (bool, default true for demo), created_at

demands
  id, buyer_id (fk), crop, quantity_kg, quality_grade_min, price_offered, status (open | fulfilled), created_at

transactions
  id, lot_id (fk), demand_id (fk), status (offered | accepted | pickup_confirmed | payment_initiated | payment_received | disputed),
  offer_price, created_at, updated_at
```

Keep `quality_grade` as a plain text enum (`A`, `B`, `C`) mapped to Agmarknet's standard grade categories — do not build a separate grading taxonomy table for the prototype.

---

## 4. Core Logic Spec

### 4.1 Price Advisory Engine
- Input: crop, quantity, farmer's location (lat/lng).
- Pull last 14 days of Agmarknet price data for that crop across the 3 nearest mandis (nearest by straight-line distance is fine — don't build real routing for this specific step, just for the transport-cost estimate below).
- Compute a simple 7-day moving average per mandi to detect trend direction (rising / falling / flat).
- Estimate transport cost: distance (via OSRM) × a flat per-km-per-quintal rate (hardcode a reasonable rate, e.g. ₹X/km/quintal — document your assumption, don't over-engineer).
- Net price per mandi = mandi price − estimated transport cost.
- Recommendation logic (keep it simple, not ML):
  - If net price is within 5% of the 7-day high **and** trend is flat/rising → "Sell now at [mandi]."
  - If trend is rising and current price is notably below the 7-day high → "Hold — prices trending up, check again in 2–3 days."
  - If trend is falling → "Sell now — prices trending down."
- Output: plain-language message, not a raw number dump. This message is what gets sent back on WhatsApp.

### 4.2 NLP Intake
- Send the farmer's raw WhatsApp message text to Groq with a system prompt instructing it to extract `{crop, quantity_kg, quality_grade, location_text}` as JSON, with `null` for anything not mentioned.
- If any required field is `null`, reply asking specifically for the missing field (don't guess) — keep this a simple one-follow-up-question loop, not a full dialogue manager.
- Once complete, geocode `location_text` via Nominatim to get lat/lng, then create the `lot` record and trigger the Price Advisory Engine.

### 4.3 Matching
- When a buyer posts a demand, query `lots` where `crop` matches and `status = 'open'`, sorted by proximity to a reference point (or just list all matching-crop lots for the prototype — real geo-matching is a nice-to-have, not critical path).
- If no single lot meets `demand.quantity_kg`, sum the smallest set of nearby open lots that together meet it (simple greedy aggregation — sort by proximity, accumulate until quantity is met). This satisfies the "dynamic aggregation" differentiator without needing a real optimization algorithm.

---

## 5. Step-by-Step Build Plan (2 people, ~6 working days)

Two people means two parallel tracks that meet at integration points. Assign:
- **Dev A — Backend/Data track:** database schema, price engine, matching logic, transaction status API
- **Dev B — Interface track:** WhatsApp bot (Twilio + Groq), buyer dashboard UI (Next.js pages)

Both use the same Next.js repo and Supabase project from day one — don't let either person build against a separate local database.

### Day 1 — Foundation (both, together, ~half day; then split)
- [ ] Create GitHub repo, invite both collaborators
- [ ] Create Supabase project, run schema from Section 3, get connection keys
- [ ] Create Vercel project linked to the repo, confirm a blank Next.js app deploys
- [ ] Register for data.gov.in, get Agmarknet API key, pull one sample response for one crop to confirm access works
- [ ] Create Twilio account, activate WhatsApp Sandbox, both phones join the sandbox
- [ ] Create Groq API key, run one test structured-extraction call

**Split after this point.**

### Day 2 — Dev A: Price Advisory Engine
- [ ] Write the Agmarknet fetch function (crop + nearest-mandi list → last 14 days of prices)
- [ ] Implement 7-day moving average + trend detection
- [ ] Implement transport cost estimate via OSRM distance
- [ ] Implement the sell-now/hold recommendation logic (Section 4.1)
- [ ] Unit test with 2–3 real crops (onion, tomato, soybean) against real data — this is the headline feature, don't rush it
- [ ] Expose as a Next.js API route: `POST /api/price-advisory`

### Day 2 — Dev B: WhatsApp Intake
- [ ] Set up Twilio webhook → Next.js API route (`POST /api/whatsapp-webhook`)
- [ ] Wire incoming message text to Groq extraction call (Section 4.2)
- [ ] Implement the missing-field follow-up-question loop
- [ ] On complete extraction, geocode location via Nominatim
- [ ] Send a WhatsApp reply confirming the parsed lot details back to the farmer (before price advisory is wired in — confirm the loop works first)

### Day 3 — Integration Point 1
- [ ] Dev B calls Dev A's `/api/price-advisory` endpoint once a lot is created, formats the response as a plain-language WhatsApp reply
- [ ] Test end-to-end: send a real WhatsApp message → get a real price recommendation back, using real data
- [ ] **This is your first real milestone. Do not move on until this works reliably, twice in a row, from a clean state.**

### Day 4 — Dev A: Buyer Data Layer + Matching
- [ ] Build `/api/demands` (POST to create, GET to list)
- [ ] Build matching logic (Section 4.3) as `/api/demands/[id]/matches`
- [ ] Build `/api/transactions` (create on offer, update status)

### Day 4 — Dev B: Buyer Dashboard UI
- [ ] Page: post a new demand (form: crop, quantity, quality, price)
- [ ] Page: view matched lots for a demand (calls Dev A's matching endpoint)
- [ ] Page: send an offer on a lot/aggregated cluster
- [ ] Page: transaction status list (offered → accepted → pickup → payment)

### Day 5 — Integration Point 2
- [ ] Buyer sends an offer from the dashboard → farmer receives it as a WhatsApp message → farmer replies "accept" or "reject" → dashboard updates in near-real-time (polling is fine, no need for websockets)
- [ ] Add the static logistics/storage lookup (hardcoded list, shown once a deal is accepted)
- [ ] Add the dispute "flag" button (writes `status = 'disputed'`, shows in a flagged list on the dashboard)

### Day 6 — Polish, Test, Rehearse
- [ ] Run the full flow end-to-end at least 3 times as a team, from a clean database each time
- [ ] Seed 2–3 realistic demo farmers/lots/buyers so the dashboard doesn't look empty on first load
- [ ] Fix the top 3 bugs that broke the flow during testing — don't chase anything beyond that
- [ ] Confirm the deployed Vercel URL works, not just localhost
- [ ] If using Render for a separate Python service, ping it ~5 minutes before any live demo to avoid the cold-start delay

---

## 6. Free-Tier Limits to Watch (so they don't surprise you mid-build)

| Service | Free limit | What happens if you hit it | Mitigation |
|---|---|---|---|
| Twilio WhatsApp Sandbox | Free, but each participant phone must send the join code and it expires after ~72 hours of inactivity | Messages stop being received | Re-send the join code before any demo/rehearsal |
| Groq free tier | Rate-limited per minute (check current limits on their pricing page — they change) | Requests get throttled/rejected | Add basic retry logic; don't hammer it in a tight test loop |
| Supabase free tier | 500MB database, project pauses after 1 week of total inactivity | Old unused projects go inactive | Log in and touch the project at least once a week during the build |
| Vercel free (Hobby) | Fine for this use case; serverless function execution has a timeout (~10s on Hobby) | A slow price-advisory call could time out | Keep the Agmarknet fetch + computation fast; cache repeated crop/mandi lookups in memory per request |
| data.gov.in API | Free but sometimes rate-limited/unstable | Requests fail intermittently | Cache pulled data locally (a simple in-memory or Supabase cache table) so a flaky API call doesn't break a live demo |

---

## 7. Definition of Done (Prototype)

You're done when, starting from a clean database with 2–3 seeded records, one person can:
1. Send a real WhatsApp message describing a crop lot and receive a real, data-backed sell-now/hold recommendation.
2. On a separate device, post a buyer demand on the live Vercel URL and see the farmer's lot matched to it.
3. Send an offer, have the farmer accept it via WhatsApp, and watch the transaction status update on the dashboard.

If that loop works twice in a row without manual database edits in between, the prototype is demo-ready. Everything past that is polish, not requirement.
