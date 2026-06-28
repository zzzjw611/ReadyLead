# ReadyLead

**ReadyLead helps contractors find building maintenance leads before property managers request bids.**

ReadyLead is an AI GTM platform for contractors. It turns building-level maintenance signals, public complaint data, contact paths, and contractor matching into ranked, evidence-backed sales opportunities.

Built during the **Orange Slice x YC AI Growth Hackathon**.

---

## Live Demo

**Demo:** `YOUR_VERCEL_LINK`
**GitHub:** `https://github.com/zzzjw611/ReadyLead`

Recommended demo flow:

1. Open the dashboard.
2. Click **Seed Demo Data** if the database is empty.
3. Click **Import SF 311 No-Heat Signals**.
4. Open **Mission Creek Residences**.
5. Review the building profile, maintenance signals, contact path, matched contractors, and outreach draft.
6. Click **Add New HOA Signal**.
7. Watch the opportunity score jump from around **72** to **92 / Hot**.
8. Return to the dashboard and see the board re-rank in real time.

---

## Problem

Contractors usually buy leads through reactive channels:

* Google Ads
* Yelp
* Angi
* Thumbtack
* Referrals
* Inbound search

These channels only activate **after something breaks**. By then, the customer is already shopping, and every competitor is bidding for the same job.

The deeper GTM problem is that contractors do not know:

* Which buildings are likely to need maintenance soon
* Which maintenance signals actually matter
* Who the building decision maker is
* Which contact path is most reliable
* Which contractor is the best fit
* What outreach message to send

---

## Solution

ReadyLead turns early building maintenance signals into contractor sales opportunities.

The platform analyzes:

* Building age
* HVAC permit history
* Resident complaints
* HOA notes
* Weather stress
* Plan-extracted systems
* SF 311 no-heat complaint signals
* Property contact path data

Then it:

1. Scores the building opportunity
2. Explains the evidence
3. Finds the best contact path
4. Matches qualified HVAC contractors
5. Drafts cautious, evidence-backed outreach

ReadyLead does **not** claim guaranteed failure prediction. It performs **signal-based opportunity scoring** for contractor GTM workflows.

---

## Architecture

```text
Data Sources
↓
Convex DB
↓
Signal Scoring Agent
↓
Contact Path Agent
↓
Contractor Matching Agent
↓
Outreach Draft Agent
↓
Dashboard
```

### Data Sources

The MVP uses fake but realistic seeded data for buildings, signals, contractors, and contact paths, plus an SF 311-style no-heat complaint import demo.

### Convex DB

Convex stores:

* Buildings
* Signals
* Contact paths
* Contractors
* Opportunities

It also powers the real-time dashboard and live signal injection flow.

### Signal Scoring Agent

Scores HVAC maintenance opportunity risk using deterministic rules and grounded evidence.

Example signals:

* Old building
* No major HVAC permit in 10+ years
* Repeated cooling or heating complaints
* HOA discussion about vendor options
* Heat wave stress
* Central or rooftop HVAC system

### Contact Path Agent

Ranks the best way to reach the likely decision maker.

Example contact paths:

* Property website contact form
* Leasing office
* Property manager
* Facilities contact
* Permit record contact
* LinkedIn search path
* Owner entity
* Registered agent

Each contact path receives a confidence score.

### Contractor Matching Agent

Matches HVAC contractors based on:

* Trade
* Service area
* Building type
* Specialty
* Preventive maintenance fit
* Rooftop or central HVAC experience

### Outreach Draft Agent

Generates cautious, evidence-backed outreach from a matched contractor to the best available contact path.

---

## SF 311 Import Demo

ReadyLead includes an SF 311-style no-heat complaint import demo.

Flow:

```text
SF 311 no-heat complaint
↓
Building address
↓
Landlord / contact path
↓
HVAC opportunity score
↓
Matched contractors
↓
Outreach draft
```

The MVP uses static demo rows inspired by SF 311 no-heat complaint data. It does **not** scrape live city data.

Example signal:

```text
Open SF 311 no-heat complaint reported at 953 Kearny St in Chinatown.
```

This becomes a higher-priority HVAC opportunity when combined with complaint status, address, landlord/entity data, and contact-path confidence.

---

## Demo Flow

### 1. Opportunity Board

The dashboard shows buildings ranked by HVAC maintenance opportunity score.

Each card includes:

* Building name
* City
* Building type
* Risk score
* Urgency window
* Predicted need
* Contact path confidence
* Evidence preview
* Source badge, including SF 311 where applicable

### 2. Building Detail

Each building page shows:

* Building profile
* Signal timeline
* Signal-based risk analysis
* Contact path agent results
* Matched contractors
* Outreach draft

### 3. Live Signal Injection

Clicking **Add New HOA Signal** injects this signal:

```text
HOA minutes: Board received 12 cooling complaints during the June heat wave and asked management to collect HVAC vendor options before the next meeting.
```

The system then re-analyzes the building and updates the score in Convex.

For the demo building, the score moves from around **72** to **92 / Hot**.

---

## Tech Stack

* **Next.js App Router**
* **TypeScript**
* **Tailwind CSS**
* **Convex**
* **OpenAI SDK**
* **Zod**
* **lucide-react**
* **clsx**
* **Vercel**

---

## Sponsor Usage

### OpenAI

OpenAI is the intended reasoning and drafting layer for richer future versions of signal analysis and outreach generation.

For hackathon reliability, the MVP also includes deterministic fallback logic, so the demo works even without an API key.

### Convex

Convex powers:

* Real-time database
* Opportunity board
* Seed data
* SF 311 import
* Signal injection
* Dashboard re-ranking
* Building detail updates

### Orange Slice

Orange Slice is represented as an optional/mock contact enrichment layer for the Contact Path Agent.

The MVP does not depend on live Orange Slice integration.

### Cursor / Codex

Used for rapid full-stack development during the hackathon.

---

## How to Run Locally

Install dependencies:

```bash
npm install
```

Start Convex:

```bash
npx convex dev
```

Start the Next.js app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Then go to:

```text
/dashboard
```

If the database is empty:

1. Click **Seed Demo Data**
2. Click **Import SF 311 No-Heat Signals**

---

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_CONVEX_URL=
OPENAI_API_KEY=
ORANGE_SLICE_API_KEY=
```

Required:

```bash
NEXT_PUBLIC_CONVEX_URL=
```

Optional:

```bash
OPENAI_API_KEY=
ORANGE_SLICE_API_KEY=
```

The MVP works without OpenAI or Orange Slice keys because deterministic fallback logic is included.

---

## Deployment

The app is deployed on Vercel and connected to Convex Cloud.

For production deployment, set this environment variable in Vercel:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

Deploy Convex functions:

```bash
npx convex deploy
```

Deploy the frontend:

```bash
vercel --prod
```

---

## Reset Demo Data

Before presenting, reset the demo:

```bash
npx convex run seed:seedAll
npx convex run sf311:importSF311DemoData
```

This restores the initial opportunity board and resets Mission Creek Residences before the live signal injection demo.

---

## Hackathon Scope

This MVP uses fake but realistic building, signal, contact path, contractor, and SF 311-style complaint data.

It performs **signal-based opportunity scoring**, not guaranteed failure prediction.

Not included in MVP:

* Real-time scraping
* Real Google Reviews scraping
* Real permit API
* Real CAD parsing
* Real email sending
* Auth
* Billing
* Full CRM
* Verified contact database
* Production-grade prediction model

---

## Future Vision

Future versions could include:

* Real permit data integration
* Live SF 311 / public complaint ingestion
* Google Reviews and public signal monitoring
* Weather and inspection feeds
* CAD / plan extraction
* Verified property contact graph
* Contractor CRM integrations
* Email sequencing and human approval workflow
* Contractor subscription and premium lead marketplace

---

## Final Pitch

ReadyLead helps contractors stop waiting for reactive leads.

It turns early building maintenance signals into ranked, evidence-backed sales opportunities before the market becomes competitive.
