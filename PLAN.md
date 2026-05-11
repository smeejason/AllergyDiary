# Allergy Diary — Build Plan

## Purpose

A personal allergy and health diary that:

- Captures daily symptom data with minimal friction (one-tap, voice, web, mobile)
- Automatically pulls in environmental context (pollen, weather, wind) for Whenuapai, Auckland
- Automatically pulls in health signals from Apple Watch (sleep, HRV, resting heart rate, respiratory rate)
- Surfaces correlations between environment, sleep, and symptoms over time
- Helps measure whether ongoing immunotherapy is working

## User context

- Lives in Whenuapai, Auckland (rural, surrounded by grass and wheat farmland)
- Allergic to grass pollens, weeds, and rye specifically
- 2 years into immunotherapy
- This year: mild spring, nasty autumn — likely secondary grass flush plus possible autumn mold/spore component
- Uses iPhone, Windows laptop, Apple Watch
- Has M365 subscription
- Comfortable with VS Code + Claude Code

## Architectural decisions

| Concern | Choice | Why |
|---|---|---|
| Auth | Microsoft Entra ID (personal Microsoft accounts) | Free, built into Static Web Apps, already signed in everywhere |
| Frontend hosting | Azure Static Web Apps | Free tier, familiar Microsoft ecosystem, integrated auth, GitHub Actions deploy |
| Backend logic | Azure Functions (bundled with Static Web Apps) | Server-side calls to pollen/weather APIs, secrets stay out of browser |
| Database | Supabase (Postgres) | Free tier, great DX, real-time capable, easy to query later |
| Frontend framework | Next.js 15 + TypeScript + Tailwind | Modern, well-supported, works on Static Web Apps |
| Mobile capture | PWA + Apple Shortcuts → Azure Function endpoint | No App Store, no Apple Developer fee, voice via Siri |
| Apple Health bridge | Auto Export iOS app → Azure Function → Supabase | Reliable, $6 one-time, no HealthKit code needed |
| Pollen data | Google Pollen API | Covers NZ, breaks down by grass/tree/weed, free tier sufficient |
| Weather/wind data | Google Weather API or MetService/NIWA | Wind direction critical for rural location |

## Data model (initial)

### `entries` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth users |
| `created_at` | timestamptz | When the entry was logged |
| `entry_date` | date | The date the entry refers to (may differ from created_at) |
| `overall_score` | int | 1–5 how the user feels overall |
| `symptoms` | jsonb | `{eyes: 0-3, nose: 0-3, chest: 0-3, throat: 0-3, energy: 0-3, sleep_felt: 0-3}` |
| `notes` | text | Free text, voice transcription target |
| `medications_taken` | text[] | e.g. `['antihistamine', 'nasal_spray']` |
| `environmental_snapshot` | jsonb | Pollen + weather captured at time of entry |
| `local_events` | jsonb | `{mowing_nearby: bool, harvest_nearby: bool, indoors_day: bool, ...}` |

### `health_data` table (Phase 2)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth users |
| `date` | date | One row per day |
| `sleep_hours` | numeric | |
| `sleep_score` | int | |
| `resting_hr` | int | |
| `hrv_ms` | numeric | |
| `respiratory_rate` | numeric | Overnight average |
| `blood_oxygen_min` | numeric | Overnight minimum |
| `wrist_temp_deviation` | numeric | If available (Series 8+) |
| `raw_payload` | jsonb | Whole Auto Export payload for that day |

### `environmental_log` table (Phase 2)

Daily pull of pollen and weather data for Whenuapai, stored even on days with no symptom entry. This is what makes long-term correlation possible.

## Build phases

### Phase 1 — Capture the habit (Sessions 1–3)

Goal: get logging entries from web and phone, hosted on real Azure URL, with environmental data captured per entry. No HealthKit, no auth, no correlations yet — just prove the core loop and start accumulating data.

**Session 1 — Scaffold and prove the loop**
1. Create GitHub repo
2. Scaffold Next.js 15 + TypeScript + Tailwind locally
3. Create Supabase project (Sydney region)
4. Create `entries` table with schema above
5. Build the daily log screen: 1–5 score, symptom toggles, notes, save button
6. Wire it to Supabase from a Next.js API route
7. Verify entries appear in Supabase dashboard
8. Deploy to Azure Static Web Apps via GitHub Actions

**Session 2 — Auth and environmental data**
1. Configure Microsoft Entra ID auth in Static Web Apps
2. Protect the log screen behind login
3. Set up Google Cloud project, enable Pollen API and Weather API
4. Create Azure Function endpoints that proxy these APIs (so the keys stay server-side)
5. Auto-fetch and display today's pollen/wind/weather on the log screen
6. Save environmental snapshot into each entry

**Session 3 — Mobile capture and history**
1. Configure PWA manifest and service worker so the site installs to iPhone home screen
2. Build a history view: list of entries + simple time series chart
3. Create an HTTP-triggered Azure Function for Apple Shortcuts to POST to
4. Build the Shortcut on iPhone: "Hey Siri, allergy log" → asks for score → asks for voice notes → submits

### Phase 2 — Bring in health data (Sessions 4–5)

**Session 4 — Apple Health bridge**
1. Install Auto Export on iPhone, configure to POST nightly to an Azure Function
2. Create `health_data` table in Supabase
3. Azure Function parses Auto Export payload, stores relevant fields
4. Verify a full day of HealthKit data appears

**Session 5 — Daily environmental log**
1. Scheduled Azure Function (timer trigger) pulls pollen/weather/wind for Whenuapai every 6 hours
2. Stores in `environmental_log` table
3. Now we have continuous environmental data regardless of whether an entry was made

### Phase 3 — Make it useful (Sessions 6+)

- Correlation views: symptoms vs. pollen, vs. sleep, vs. HRV
- Trend over time: are symptoms declining (immunotherapy working)?
- "Bad day" detection: which combinations of environmental factors predict your worst days
- Tomorrow's forecast + suggested actions
- Export view for sharing with allergist

### Phase 4 — Hardware additions (optional, post-build)

Hardware to consider buying once the app is logging well:

- **Peak flow meter (~$30 NZD)** — highest-value addition. Twice-daily lung function reading. Manual entry into the diary.
- **Indoor air quality monitor (e.g. Awair, ~$200 NZD)** — checks whether your house is actually a refuge from outdoor pollen
- **Pulse oximeter (~$30 NZD)** — spot checks during bad episodes (Watch covers most cases)

## Accounts and prerequisites checklist

Before Session 1:

- [ ] GitHub account (create private repo `allergy-diary`)
- [ ] Microsoft account (you have one via M365)
- [ ] Azure account (free, sign in with Microsoft account)
- [ ] Supabase account (sign up via GitHub)
- [ ] Google Cloud account with billing enabled (free tier covers everything; billing required for API keys)

Software on Windows machine:

- [ ] Node.js 20+ (`node --version`)
- [ ] Git (`git --version`)
- [ ] VS Code with Claude Code

Optional now, required in Phase 2:

- [ ] Auto Export app on iPhone ($6 USD one-time)

## Privacy and data ownership

This is personal health data. Decisions baked into the architecture:

- Data lives in your own Supabase project, in your tenancy. You can export the entire database as a SQL dump anytime.
- Auth is via your Microsoft account — Microsoft sees you signed in, but never sees diary contents.
- Azure Functions handle API keys server-side so Google never sees them in browser code.
- No analytics or third-party tracking in the app.
- Optional in Phase 3: a "share with allergist" view that generates a time-limited read-only link.

## Open questions to resolve as we go

- Domain name: stick with `*.azurestaticapps.net` or buy a real domain later?
- Backup strategy: nightly export of Supabase to OneDrive via Azure Function?
- Symptom taxonomy: start with the 6 fields above, or talk to allergist first about what they'd want logged?
- Should we capture local farm activity calendar (mowing, harvest) automatically somehow, or stay manual?

## Notes for future Claude Code sessions

If you (the human) come back to this project in a new session, point Claude Code at this file first. The architectural decisions are settled; do not re-litigate them unless the human explicitly wants to. Pick up at whichever session is next based on what's already in the repo.
