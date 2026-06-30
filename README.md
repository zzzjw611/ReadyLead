# ReadyLead

ReadyLead is an AI-powered commercial building intelligence platform that helps contractors discover, qualify, and act on maintenance opportunities before competitors.

---

## Why ReadyLead

Commercial contractors spend enormous time chasing leads that are already saturated. By the time a property manager posts an RFP or starts calling around, every competitor is bidding for the same job.

ReadyLead continuously monitors public and private signals to surface high-intent maintenance opportunities before they become traditional RFPs.

- **Earlier discovery** — surface buildings from public records (311 complaints, permits, system age) before owners start shopping
- **Better qualification** — score and rank opportunities by evidence, not guesswork
- **AI-assisted outreach** — draft messages and place follow-up calls grounded in building context
- **Higher win rate** — reach decision-makers while the problem is acute

---

## Current MVP

San Francisco HVAC is the initial vertical. Everything below exists in the repo today.

- **Opportunity feed** — interactive map and ranked list of scored buildings (`/signals`), generated from public DataSF records via the Python pipeline
- **Building profiles** — per-building detail pages with signal timeline, risk analysis, and system context (`/building/[id]`)
- **AI summaries** — evidence-backed rationales explaining why each opportunity is worth pursuing ("why it'll close")
- **Pipeline management** — queue leads from the map into an outreach workflow (`/calls`), persisted in the browser
- **Voice outreach** — outbound calls via Vapi with a scripted demo fallback when Vapi is not configured
- **Dashboard** — Convex-powered opportunity board with demo seeding, SF 311 import, and live signal injection (`/dashboard`)

Supporting agents (deterministic, evidence-backed):

- Signal scoring, contact path ranking, contractor matching, outreach draft generation

Data pipeline (`pipeline/`): crawl DataSF 311 + permits → composite score → threshold gate → optional contact enrichment → sync to app (PII scrubbed).

Not included: auth, billing, CRM, live in-app scraping, real email delivery, or predictive failure modeling.

---

## Product Vision

The long-term vision is an AI operating system for commercial building operations.

Future capabilities may include:

- Company memory
- AI agents
- Continuous signal monitoring
- Automated outreach
- Opportunity prioritization
- CRM integration

None of the above are built yet.

---

## Tech Stack

From `package.json` and the codebase:

- **Next.js** 16 (App Router)
- **React** 19
- **TypeScript**
- **Convex** (real-time demo dashboard)
- **Tailwind CSS** 4
- **Zod**, **clsx**, **lucide-react**
- **Vapi** (voice calls, via API route)
- **Leaflet** (maps, CDN)
- **Python 3** (data pipeline — DataSF APIs, DeepLine CLI)

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Routes:** `/` (landing) · `/signals` (map) · `/calls` (outreach) · `/dashboard` (demo board)

**Convex** (required for `/dashboard` and `/building`):

```bash
npx convex dev
```

Add to `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Voice outreach** (optional):

```
VAPI_API_KEY=
VAPI_ASSISTANT_ID=
VAPI_PHONE_NUMBER_ID=
DEMO_PHONE=+1xxxxxxxxxx
```

**Data pipeline** (optional): see [`pipeline/README.md`](pipeline/README.md).

---

## Repository Structure

```
src/app/          Next.js routes
src/components/   UI (shell, opportunity board, building detail)
src/lib/          Agents, scoring, contact logic
src/data/         Static and pipeline-generated opportunity data
convex/           Schema, queries, mutations, seed functions
pipeline/         Python crawl → score → enrich → sync
```

---

## Status

🚧 Active Development

Built by Nara Labs.

---

## Design Principles

ReadyLead follows several AI-native principles:

- AI reduces work instead of creating work.
- Human approval before automation.
- Context accumulates over time.
- Every interaction should increase future intelligence.
