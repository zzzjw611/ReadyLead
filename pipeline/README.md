# ReadyLead data pipeline (SF)

The real signal engine behind the Opportunity map. Pure public data + DeepLine
enrichment. **No API keys for the crawl/score** (DataSF is open); contact
enrichment uses the DeepLine CLI.

## Flow

```
score.py        crawl + score   DataSF 311 (vw6y-z8j6) + permits (i98e-djp9)
                                → multi-signal composite score + segment
                                → building_opportunities.csv
hvac_engine.py  gate + enrich   score ≥ threshold → DeepLine waterfall
                                (skip-trace + email validation + LLC→officer)
                                + "why it'll close" rationale
                                → qualified_opportunities.csv
gen_map_data.py sync to app     → ../src/data/mapOpportunities.ts  (PII-scrubbed)
```

## Run

```bash
cd pipeline
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python hvac_engine.py --threshold 70 --max-enrich 15   # crawl→score→gate→enrich
.venv/bin/python gen_map_data.py                                 # update the map data
```

The daily cron equivalent: `score` is free, and only NEW gated buildings get
enriched (the engine caches), so steady-state cost stays small.

## Privacy

`gen_map_data.py` writes only public-record-derived fields (address, score,
signals, rationale) to `src/data/mapOpportunities.ts`. Owner emails/phones from
skip-trace stay in the gitignored CSVs and never reach this public repo.
