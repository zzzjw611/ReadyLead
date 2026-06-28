#!/usr/bin/env python3
"""
HVAC opportunity engine — the full gated pipeline.

  CRAWL (free, backend APIs)            score.py  → building_opportunities.csv
   └ DataSF 311 (vw6y-z8j6) + permits (i98e-djp9) + DBI
  SCORE (free)                          multi-signal composite → segment + score
   └ THRESHOLD GATE — only score >= --threshold proceed (protects enrich credits)
        CONTACT WATERFALL (paid, only on gated)
          person : DataSF biz-reg owner → enformion skip-trace → leadmagic validate
          entity : enformion_business_search (officer) → enformion_person_search → validate
          + domain judgment (self-managed vs property-manager)
        RATIONALE — "why this could close" per qualified opportunity
  OUTPUT  qualified_opportunities.csv  (+ idempotent cache for hourly runs)

Usage:
  python hvac_engine.py --threshold 70 --max-enrich 15     # one gated run
  python hvac_engine.py --threshold 70 --max-enrich 15 --skip-score   # reuse last crawl
Hourly: */60 cron → only NEW gated buildings get enriched (cache skips the rest).
"""
import argparse, csv, json, os, re, subprocess, sys

OUT = "out"; ECACHE = "out/enrich_cache.json"
BIZ = "https://data.sfgov.org/resource/g8m3-pdis.json"
ENTITY_KW = re.compile(r'\b(LLC|L L C|INC|CORP|\bCO\b|LP|L P|TRUST|PROPERT|MANAGEMENT|MGMT|ASSOC|PARTNERS|HOLDINGS|GROUP|FUND|ENTERPRISE|REALTY|INVEST|HOUSING|VENTURE|HOTEL|OWNER|FAMILY|COMPANY)\b', re.I)
UNIT_KW = re.compile(r'\b(APT|STE|UNIT|FL|FLOOR|RM|SUITE)\b|#', re.I)
ADDR_RE = re.compile(r'(\d+)\s+(.+?)\s+(ST|AVE|AV|BLVD|DR|STREET|TER|PL|CT|WAY|LN|RD)\b', re.I)
PM_DOMAIN = re.compile(r'(prop|realty|mgmt|management|apartment|residential|estate|leasing|homes)', re.I)
FREEMAIL = re.compile(r'@(gmail|yahoo|msn|hotmail|aol|icloud|sbcglobal|comcast|att|outlook|live)\.', re.I)
import requests


def dl(tool, payload):
    try:
        o = subprocess.run(["deepline", "tools", "execute", tool, "--json", "--input", json.dumps(payload)],
                           capture_output=True, text=True, timeout=150)
        i = o.stdout.find("{"); return json.loads(o.stdout[i:]) if i >= 0 else {}
    except Exception as e:
        return {"_err": str(e)}

def _emails_phones(d):
    raw = d.get("toolResponse", {}).get("raw", d)
    em, vem, ph, ad = [], [], [], []
    def walk(o):
        if isinstance(o, dict):
            if o.get("email"): (vem if o.get("isValidated") else em).append(o["email"])
            for k, v in o.items():
                kl = k.lower()
                if kl == "phonenumber" and isinstance(v, str): ph.append(v)
                if kl == "number" and isinstance(v, str) and re.search(r'\d', v): ph.append(v)
                if kl == "street" and isinstance(v, str): ad.append(v)
                walk(v)
        elif isinstance(o, list):
            for x in o: walk(x)
    walk(raw); dd = lambda xs: list(dict.fromkeys(xs))
    return dd(vem or em)[:4], dd(ph)[:4], dd(ad)[:4]


# ── landlord lookup (DataSF business reg) ──
def find_landlord(num, name):
    try:
        rows = requests.get(BIZ, params={"$where": f"upper(full_business_address) like '%{num} {name}%'", "$limit": 50}, timeout=40).json()
    except Exception:
        return None
    best, bs = None, 0
    for r in rows:
        addr = (r.get("full_business_address") or "").upper(); am = ADDR_RE.match(addr)
        if not am or am.group(1) != num or am.group(2).strip() != name: continue
        dba = r.get("dba_name") or ""; bare = not UNIT_KW.search(addr)
        s = (3 if bare else 0) + (2 if re.search(r'apart|apts\b', dba, re.I) else 0) + (1 if num in dba else 0)
        if s > bs: best, bs = r, s
    if not best or bs < 2: return None
    own = best.get("ownership_name", "")
    return {"owner": own, "dba": best.get("dba_name", ""),
            "mailing": " ".join(str(best.get(k, "")) for k in ("mail_address", "mail_city", "mail_state") if best.get(k)).strip(),
            "is_entity": bool(ENTITY_KW.search(own))}


def split_name(own):
    toks = [t for t in re.split(r'[\s/]+', own.strip()) if t and t != "&"]
    if len(toks) < 2: return None
    first = next((t for t in toks[1:] if len(t) > 1), None)
    return (first, toks[0]) if first else None


def validate_emails(emails):
    out = []
    for e in emails:
        v = dl("leadmagic_email_validation", {"email": e}).get("toolResponse", {}).get("raw", {}).get("email_status", "?")
        out.append((e, v))
    return out


# ── contact waterfall ──
def enrich_contact(landlord, city="San Francisco, CA"):
    res = {"owner": landlord["owner"], "via": "", "emails": [], "phones": [], "validated": [], "addrs": []}
    if not landlord["is_entity"]:
        nm = split_name(landlord["owner"])
        if nm:
            em, ph, ad = _emails_phones(dl("enformion_contact_enrich", {"first_name": nm[0], "last_name": nm[1], "city_state": city}))
            res.update({"via": "owner-skiptrace", "emails": em, "phones": ph, "addrs": ad})
    else:
        # entity → officers → person
        d = dl("enformion_business_search", {"name": landlord["owner"], "city_state": city})
        recs = d.get("toolResponse", {}).get("raw", {}).get("businessV2Records", [])
        offs = []
        for r in recs:
            for f in r.get("usCorpFilings", []): offs += f.get("officers", []) or []
        for o in offs:
            nm = o.get("name", {}); first, last, raw = nm.get("nameFirst"), nm.get("nameLast"), (nm.get("nameRaw") or "")
            if not first or not last or ENTITY_KW.search(raw) or o.get("title") == "REGISTERED AGENT": continue
            em, ph, ad = _emails_phones(dl("enformion_person_search", {"first_name": first, "last_name": last, "city_state": city}))
            if em or ph:
                res.update({"via": f"LLC→officer {first} {last} ({o.get('title','')})", "emails": em, "phones": ph, "addrs": ad}); break
    # validate
    res["validated"] = validate_emails(res["emails"][:2]) if res["emails"] else []
    # domain judgment
    dom_mgmt = any(PM_DOMAIN.search(e) for e in res["emails"])
    res["management"] = "property-manager (firm email)" if dom_mgmt else ("self-managed (personal email)" if res["emails"] and FREEMAIL.search(res["emails"][0]) else "")
    return res


def confidence(res, mailing):
    if not (res["emails"] or res["phones"]): return "no contact"
    if any(v == "valid" for _, v in res["validated"]): return "HIGH (validated email)"
    mm = re.match(r'(\d+)\s+(\w+)', (mailing or "").upper())
    if mm and any(mm.group(1) in a.upper() and mm.group(2) in a.upper() for a in res["addrs"]): return "HIGH (mailing match)"
    if res["emails"] and not FREEMAIL.search(res["emails"][0]): return "HIGH (business email)"
    return "MED (verify before send)"


def rationale(b, landlord, res):
    seg = b["segment"]; bits = []
    if b.get("active_cost"): bits.append(f"a live ${int(int(b['active_cost'])/1e6)}M permitted project (mechanical scope to bid now)")
    if str(b.get("acute_open")).lower() == "true": bits.append("an OPEN 311 habitability complaint (landlord legally on the hook today)")
    elif int(b.get("acute_count") or 0) > 1: bits.append(f"{b['acute_count']} repeat building-system 311 complaints (chronic failure)")
    elif int(b.get("acute_count") or 0) == 1: bits.append("a recent building-system 311 complaint (active fault)")
    if b.get("system_age") and str(b["system_age"]).isdigit() and int(b["system_age"]) >= 15:
        bits.append(f"a ~{b['system_age']}-yr-old system (past typical 15-20yr life → replacement, not just repair)")
    reach = ""
    if res["validated"] and any(v == "valid" for _, v in res["validated"]):
        reach = f" The {'owner' if not landlord['is_entity'] else 'LLC officer'} is reachable at a verified email"
    elif res["emails"] or res["phones"]:
        reach = " A direct contact was found"
    seg_line = {"commercial-project": "Commercial bid opportunity", "residential-repair": "Residential repair lead",
                "commercial-repair": "Commercial repair/replacement lead", "replacement-candidate": "Replacement candidate"}.get(seg, "Opportunity")
    why = f"{seg_line}: {b['address']} has " + (", and ".join(bits) if bits else "a qualifying signal") + "."
    if reach: why += reach + (f" ({res['management']})" if res.get("management") else "") + "."
    return why


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=int, default=70)
    ap.add_argument("--max-enrich", type=int, default=15)
    ap.add_argument("--skip-score", action="store_true")
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    if not a.skip_score:
        print("crawl + score …"); subprocess.run([sys.executable, "score.py"], check=False)
    rows = list(csv.DictReader(open("building_opportunities.csv")))
    gated = [r for r in rows if int(r["score"]) >= a.threshold]
    print(f"\nGATE: {len(gated)}/{len(rows)} buildings ≥ score {a.threshold}\n")

    cache = {}
    try: cache = json.load(open(ECACHE))
    except Exception: pass

    out, spent = [], 0
    for b in gated:
        addr = b["address"]
        if addr in cache:
            rec = cache[addr]
        elif spent >= a.max_enrich:
            continue  # respect paid cap; remaining gated buildings stay queued for next run
        else:
            m = ADDR_RE.match(addr)
            landlord = find_landlord(m.group(1), m.group(2).upper()) if m else None
            if not landlord:
                rec = {"owner": "", "entity": "", "via": "no-landlord-reg", "email": "", "phone": "",
                       "confidence": "no landlord reg", "management": "", "why": ""}
            else:
                res = enrich_contact(landlord); spent += 1
                rec = {"owner": landlord["owner"], "entity": "entity" if landlord["is_entity"] else "person",
                       "via": res["via"], "email": ";".join(res["emails"]), "phone": ";".join(res["phones"]),
                       "valid": ";".join(f"{e}={v}" for e, v in res["validated"]),
                       "confidence": confidence(res, landlord["mailing"]), "management": res.get("management", ""),
                       "why": rationale(b, landlord, res)}
            cache[addr] = rec; json.dump(cache, open(ECACHE, "w"))
        out.append({**b, **{k: rec.get(k, "") for k in ("owner", "entity", "via", "email", "phone", "valid", "confidence", "management", "why")}})

    fields = ["score", "segment", "address", "neighborhood", "use", "system_age", "acute_count", "acute_open",
              "active_cost", "owner", "entity", "management", "email", "phone", "valid", "confidence", "via", "why", "block_lot", "signals"]
    with open("qualified_opportunities.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore"); w.writeheader(); w.writerows(out)
    reach = [r for r in out if r.get("email") or r.get("phone")]; hi = [r for r in reach if r["confidence"].startswith("HIGH")]
    print(f"✓ enriched {spent} new (cap {a.max_enrich}); {len(reach)} reachable ({len(hi)} HIGH) → qualified_opportunities.csv\n")
    for r in out[:12]:
        if r.get("email") or r.get("phone"):
            print(f"  [{r['score']}] {r['address']}  {r['owner'][:22]}  {(r['email'].split(';')[0] or r['phone'].split(';')[0])}  [{r['confidence']}]")
            print(f"        → {r['why']}\n")


if __name__ == "__main__":
    main()
