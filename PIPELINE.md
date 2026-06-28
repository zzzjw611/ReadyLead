# ReadyLead pipeline — from a city of public records to a booked HVAC inspection

```
1 CRAWL          2 SCORE            3 GATE          4 ENRICH (waterfall)     5 RATIONALE   6 OUTREACH
DataSF × 3 ─────→ Python ─────────→ score ≥ 70 ───→ DeepLine orchestrates ─→ LLM ───────→ Vapi + Twilio
free / no key     free               free            Enformion + LeadMagic                 + Calendar + Slack
11,578 buildings  scored + tagged    ~13 qualified   phone / email / verify
```

The crawl and scoring are **free** and run on public data, so we can look at the whole city.
Paid enrichment only ever touches the handful of buildings that already proved repeated HVAC intent.

---

## 1. Crawl — find the list
**Platform: DataSF / Socrata Open Data API (free, no key).** SoQL queries against `https://data.sfgov.org/resource/<id>.json`.

| Source | Dataset | What we pull |
|---|---|---|
| **311 cases** | `vw6y-z8j6` | HVAC-need signals (last 730 days): `no_heat` (`HEAT_LACK_OF_HEAT`), `no_hot_water` (`HOT_WATER`), `mold` (`MOLD`), `ventilation` (`VENTIL`). Records repeat count + whether still **OPEN** (landlord legally on the hook now). |
| **Building permits** | `i98e-djp9` | (a) Mechanical permits (boiler/furnace/hvac/rooftop/heat-pump…) → last mechanical year → **system age**. (b) Recently filed + mechanical scope + `estimated_cost::number ≥ $1M` → **live commercial projects** to bid now. |
| **Registered Business Locations** | `g8m3-pdis` | The **owner / landlord name** — the starting point for enrichment. (Assessor data has no owner names; business registration does.) |

Addresses are normalized (street-suffix table + block/lot) to merge all three sources to one row per building.

## 2. Score — multi-signal opportunity score
**Self-written Python (free).** Score = intent × deal-value × timing.

| Condition | Points |
|---|---|
| Live permitted project | +35, then +15/+25/+35 by size (<$5M / <$20M / ≥$20M) |
| 311 is **OPEN** (must fix now) | **+40** |
| 311 reported but closed | +22 |
| Chronic (repeat complaints) | +5 each, capped +18 |
| System 15–25 yr (end of life) | **+30** |
| System >25 yr | +16 |
| System <8 yr (recently serviced) | **−8** |
| Commercial use | +18 / apartments +12 / dwelling +4 |

Then a **segment** tag: `commercial-project` (≥$1M), `commercial-repair` / `residential-repair` (acute 311), `replacement-candidate` (system ≥15 yr), or `low-signal`. → **11,578 buildings scored**; the map shows the top 400.

## 3. Gate — protect the credits
**Self-written (free).** Only `score ≥ 70` passes (~13 buildings). The single purpose is to never spend paid enrichment on weak buildings. This is what lets the pipeline scan the whole city without burning money.

## 4. Enrich — the contact waterfall
**Platform: DeepLine orchestration; providers Enformion + LeadMagic (paid, gated).** For each qualified building:

1. **Person owner** → `enformion_contact_enrich` (Enformion skip-trace): name + address → phones + emails.
2. **LLC / entity owner** → `enformion_business_search` → officer → `enformion_person_search` → the person → skip-trace.
3. **Validate** → `leadmagic_email_validation`: marks each email valid / invalid / unknown.
4. **Self-managed vs property-managed** inferred from the email domain.
5. **Confidence** label: `HIGH (validated email)` / `MED (verify before send)` / `no contact` / `no landlord reg`.

**Honest hit rate:** of 13 qualified, 4 land a contact and 2 are full (phone + email). The misses fall into: LLC with no resolvable person, no business registration at all (no owner to find), or a skip-trace miss. 100% isn't possible — a building with no ownership record has no person to look up. The recoverable misses can be pushed higher by widening the waterfall (Prospeo / Findymail / ContactOut / Datagma).

## 5–6. After enrichment
- **Rationale (LLM):** one evidence-backed line per opportunity — the signal + age + legal pressure.
- **Outreach:** **Vapi** AI voice agent (over an imported **Twilio** number) calls the owner → confirms person + address → introduces the company → books a free inspection via the **Google Calendar** tool → posts to **Slack** `#new-hvac-lead`.

---

## Platform summary

| Stage | Platform / tool | Free? | Role |
|---|---|---|---|
| Crawl | [DataSF / Socrata](https://data.sfgov.org/) — [311 `vw6y-z8j6`](https://data.sfgov.org/d/vw6y-z8j6), [permits `i98e-djp9`](https://data.sfgov.org/d/i98e-djp9), [business reg `g8m3-pdis`](https://data.sfgov.org/d/g8m3-pdis) | ✅ | public data sources |
| Score + gate | self-written Python | ✅ | multi-signal score, segment, score≥70 gate |
| Enrich (orchestration) | [DeepLine](https://code.deepline.com) | paid | waterfall orchestration |
| Enrich (skip-trace) | [Enformion](https://www.enformion.com) | paid | name→contact, LLC→officer→person |
| Enrich (validation) | [LeadMagic](https://leadmagic.io) | paid | email validation |
| Outreach (call) | [Vapi](https://vapi.ai) + [Twilio](https://www.twilio.com) | paid | AI voice call |
| Booking | [Google Calendar](https://calendar.google.com) (Vapi tool) | — | create the inspection event |
| Notify | [Slack](https://slack.com) (Vapi tool) | — | #new-hvac-lead |
