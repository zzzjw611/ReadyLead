#!/usr/bin/env python3
"""
Building-opportunity scoring table — the unified "each building has signals" view.

Unions three FREE DataSF signal sources, merges to building level, scores each
opportunity (intent × deal-value × timing), and tags a segment.

  311 acute     (vw6y-z8j6)  → broken now            → residential/commercial repair
  aging permit  (i98e-djp9)  → last mech permit 15-25yr ago → replacement candidate
  active permit (i98e-djp9)  → new/big $1M+ mech project    → commercial project

Output: building_opportunities.csv (ranked). No enrichment credits spent — this
ranks WHO to enrich first. Then feed the top N into the contact pipeline.
"""
import csv, datetime as dt, re, requests
from collections import defaultdict

P311 = "https://data.sfgov.org/resource/vw6y-z8j6.json"
PERM = "https://data.sfgov.org/resource/i98e-djp9.json"
NOW_Y = dt.datetime.now(dt.UTC).year
SIG311 = {
    "no_heat": "%HEAT_LACK_OF_HEAT%", "no_hot_water": "%HOT_WATER%",
    "mold": "%MOLD%", "ventilation": "%VENTIL%", "plumbing": "%PLUMB%", "electrical": "%ELECTRIC%",
}
MECH = ["boiler", "furnace", "hvac", "heating", "mechanical", "air handling", "rooftop", "ductwork",
        "vrf", "chilled water", "ventilation", "air conditioning", "heat pump"]
MECH_KW = "(" + " OR ".join("lower(description) like '%%%s%%'" % k for k in MECH) + ")"
SUF = {"STREET": "ST", "ST": "ST", "AVENUE": "AV", "AVE": "AV", "AV": "AV", "BOULEVARD": "BLVD", "BLVD": "BLVD",
       "DRIVE": "DR", "DR": "DR", "ROAD": "RD", "RD": "RD", "TERRACE": "TER", "PLACE": "PL", "COURT": "CT",
       "WAY": "WAY", "LANE": "LN", "LN": "LN"}

def norm_addr(num, name, suf):
    if not num or not name: return None
    s = (suf or "").upper().strip().rstrip(".")
    return f"{str(num).strip()} {str(name).upper().strip()} {SUF.get(s, s)}".strip()

def get(base, params):
    try: return requests.get(base, params=params, timeout=90).json()
    except Exception as e: print("  query err:", e); return []


def main():
    B = defaultdict(lambda: {"address": "", "neighborhood": "", "use": "", "block_lot": "",
                             "acute_count": 0, "acute_open": False, "acute_latest": "", "signals": set(),
                             "last_mech_year": None, "active_cost": 0, "active_date": "", "lat": "", "long": ""})

    # ── source 1: 311 acute (last 730d) ──
    since = (dt.datetime.now(dt.UTC) - dt.timedelta(days=730)).strftime("%Y-%m-%d")
    for sig, like in SIG311.items():
        rows = get(P311, {"$where": f"upper(service_subtype) like '{like}' AND requested_datetime > '{since}'",
                          "$select": "address,requested_datetime,status_description,analysis_neighborhood,supervisor_district,lat,long",
                          "$limit": 5000})
        for r in rows:
            m = re.match(r'(\d+)\s+(.+?)\s+(ST|AVE|AV|BLVD|DR|STREET|TER|PL|CT|WAY|LN|RD)\b', (r.get("address") or "").upper())
            if not m: continue
            k = norm_addr(m.group(1), m.group(2), m.group(3))
            d = B[k]; d["address"] = k; d["acute_count"] += 1; d["signals"].add(sig)
            if (r.get("status_description") or "").upper() == "OPEN": d["acute_open"] = True
            d["acute_latest"] = max(d["acute_latest"], (r.get("requested_datetime") or "")[:10])
            d["neighborhood"] = d["neighborhood"] or r.get("analysis_neighborhood", "")
            d["lat"] = d["lat"] or r.get("lat", ""); d["long"] = d["long"] or r.get("long", "")
    print(f"[src1] 311 acute      → {sum(1 for v in B.values() if v['acute_count'])} buildings")

    # ── source 2: aging — last mechanical permit per building (2003+) ──
    rows = get(PERM, {"$where": f"filed_date >= '2003-01-01' AND {MECH_KW}",
                      "$select": "street_number,street_name,street_suffix,block,lot,filed_date,proposed_use",
                      "$order": "filed_date DESC", "$limit": 50000})
    n_aging = 0
    for r in rows:
        k = norm_addr(r.get("street_number"), r.get("street_name"), r.get("street_suffix"))
        if not k: continue
        d = B[k]; d["address"] = d["address"] or k
        y = int((r.get("filed_date") or "0000")[:4] or 0)
        if d["last_mech_year"] is None or y > d["last_mech_year"]:  # keep most-recent mech permit
            d["last_mech_year"] = y
            d["use"] = d["use"] or r.get("proposed_use", "")
            d["block_lot"] = d["block_lot"] or f"{r.get('block','')}/{r.get('lot','')}"
        n_aging += 1
    print(f"[src2] aging permits  → {n_aging} mech permits since 2003 merged")

    # ── source 3: active commercial projects (last 365d, $1M+ mech) ──
    since1 = (dt.datetime.now(dt.UTC) - dt.timedelta(days=365)).strftime("%Y-%m-%d")
    rows = get(PERM, {"$where": f"filed_date > '{since1}' AND {MECH_KW} AND estimated_cost::number >= 1000000",
                      "$select": "street_number,street_name,street_suffix,block,lot,filed_date,proposed_use,estimated_cost,revised_cost",
                      "$limit": 2000})
    for r in rows:
        k = norm_addr(r.get("street_number"), r.get("street_name"), r.get("street_suffix"))
        if not k: continue
        d = B[k]; d["address"] = d["address"] or k
        cost = max(float(r.get("estimated_cost") or 0), float(r.get("revised_cost") or 0))
        if cost > d["active_cost"]:
            d["active_cost"] = cost; d["active_date"] = (r.get("filed_date") or "")[:10]
            d["use"] = r.get("proposed_use", "") or d["use"]; d["block_lot"] = d["block_lot"] or f"{r.get('block','')}/{r.get('lot','')}"
    print(f"[src3] active permits → {sum(1 for v in B.values() if v['active_cost'])} commercial projects")

    # ── score + segment ──
    COMM = ("office", "hotel", "clinic", "school", "theater", "retail", "food", "gym", "studio",
            "garage", "social", "lending", "health", "recreation", "warehouse", "church")
    def score(d):
        s, why = 0, []
        if d["active_cost"]:
            c = d["active_cost"]; s += 35 + (15 if c < 5e6 else 25 if c < 20e6 else 35); why.append(f"active ${int(c/1e6)}M project")
        if d["acute_open"]: s += 40; why.append("OPEN 311")
        elif d["acute_count"]: s += 22; why.append(f"{d['acute_count']}x 311 ({','.join(sorted(d['signals']))[:30]})")
        if d["acute_count"] > 1: s += min((d["acute_count"] - 1) * 5, 18); why.append("chronic")
        age = NOW_Y - d["last_mech_year"] if d["last_mech_year"] else None
        if age is not None:
            if 15 <= age <= 25: s += 30; why.append(f"system ~{age}yr (EOL)")
            elif age > 25: s += 16; why.append(f"system {age}yr")
            elif age < 8: s -= 8; why.append("recently serviced")
        u = (d["use"] or "").lower()
        if any(k in u for k in COMM): s += 18; why.append("commercial use")
        elif "apart" in u: s += 12
        elif "dwelling" in u or "family" in u: s += 4
        return max(s, 0), "; ".join(why), age
    def segment(d):
        if d["active_cost"] >= 1e6: return "commercial-project"
        u = (d["use"] or "").lower(); resi = "dwelling" in u or "family" in u or "apart" in u
        if d["acute_count"]: return "residential-repair" if resi else "commercial-repair"
        age = NOW_Y - d["last_mech_year"] if d["last_mech_year"] else 0
        if age and age >= 15: return "replacement-candidate"
        return "low-signal"

    rows_out = []
    for d in B.values():
        if not d["address"]: continue
        sc, why, age = score(d)
        if sc <= 0: continue
        rows_out.append({
            "score": sc, "segment": segment(d), "address": d["address"], "neighborhood": d["neighborhood"],
            "use": d["use"], "system_age": age or "", "acute_count": d["acute_count"],
            "acute_open": d["acute_open"], "acute_latest": d["acute_latest"],
            "signals": ",".join(sorted(d["signals"])), "active_cost": int(d["active_cost"]) or "",
            "active_date": d["active_date"], "block_lot": d["block_lot"], "why": why, "lat": d["lat"], "long": d["long"]})
    rows_out.sort(key=lambda r: r["score"], reverse=True)

    fields = ["score", "segment", "address", "neighborhood", "use", "system_age", "acute_count", "acute_open",
              "acute_latest", "signals", "active_cost", "active_date", "block_lot", "why", "lat", "long"]
    with open("building_opportunities.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows_out)

    seg = defaultdict(int)
    for r in rows_out: seg[r["segment"]] += 1
    print(f"\n✓ {len(rows_out)} scored opportunities → building_opportunities.csv")
    print("  segments:", dict(seg))
    print(f"\n  ── TOP 18 opportunities ──")
    print(f"  {'score':<6}{'segment':<22}{'address':<22}{'why'}")
    for r in rows_out[:18]:
        print(f"  {r['score']:<6}{r['segment']:<22}{r['address'][:20]:<22}{r['why'][:60]}")


if __name__ == "__main__":
    main()
