"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Phone, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/Shell";
import { mapOpportunities, type MapOpportunity } from "@/data/mapOpportunities";

function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    const w = window as any;
    if (w.L) return resolve(w.L);
    if (!document.getElementById("leaflet-css")) {
      const css = document.createElement("link");
      css.id = "leaflet-css"; css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }
    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload = () => resolve((window as any).L);
    document.head.appendChild(js);
  });
}

const scoreColor = (s: number) => (s >= 70 ? "#ef4444" : s >= 55 ? "#f97316" : "#38bdf8");
const SIGNALS = [
  { key: "no_heat", label: "No heat" }, { key: "no_hot_water", label: "No hot water" },
  { key: "mold", label: "Mold / moisture" }, { key: "ventilation", label: "Ventilation" },
  { key: "plumbing", label: "Plumbing" }, { key: "electrical", label: "Electrical" },
];
const SEGMENTS = [
  { key: "commercial-repair", label: "Commercial repair" },
  { key: "residential-repair", label: "Residential repair" },
  { key: "commercial-project", label: "Commercial project" },
  { key: "replacement-candidate", label: "Replacement candidate" },
];

export default function MapPage() {
  const router = useRouter();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const byAddr = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<MapOpportunity | null>(null);
  const [sig, setSig] = useState("");
  const [seg, setSeg] = useState("");

  const filtered = useMemo(
    () => mapOpportunities
      .filter((o) => (!sig || (o.signals || "").split(",").includes(sig)) && (!seg || o.segment === seg))
      .sort((a, b) => b.score - a.score),
    [sig, seg]
  );

  useEffect(() => {
    (async () => {
      const L = await loadLeaflet();
      const el = mapEl.current as any;
      if (!el || el._leaflet_id) return;
      const map = L.map(el, { scrollWheelZoom: true, attributionControl: false }).setView([37.773, -122.42], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    })();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const L = (window as any).L;
    layerRef.current.clearLayers();
    byAddr.current = {};
    for (const p of filtered) {
      const m = L.circleMarker([p.lat, p.lng], {
        radius: p.qualified ? 11 : 6,
        color: p.qualified ? "#ffffff" : scoreColor(p.score),
        weight: p.qualified ? 2.5 : 1, fillColor: scoreColor(p.score), fillOpacity: 0.85,
      });
      m.on("click", () => pick(p));
      m.bindTooltip(`${p.address} · ${p.score}${p.qualified ? " · ✓" : ""}`);
      m.addTo(layerRef.current);
      byAddr.current[p.address] = m;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, filtered]);

  function pick(o: MapOpportunity) {
    setSel(o);
    const map = mapRef.current;
    if (map) map.flyTo([o.lat, o.lng], 15, { duration: 0.6 });
    byAddr.current[o.address]?.openTooltip();
  }

  function call(o: MapOpportunity) {
    try { window.localStorage.setItem("readylead_pending_call", JSON.stringify(o)); } catch { /* ignore */ }
    router.push("/calls");
  }

  return (
    <AppShell>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white"><MapPin className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted">{mapOpportunities.length} SF buildings, ranked by HVAC-need signals. Filter, pick one, and call the decision-maker.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* map */}
        <div>
          <div ref={mapEl} className="h-[66vh] min-h-[440px] w-full overflow-hidden rounded-2xl border border-card-border" style={{ zIndex: 0 }} />
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            <Legend c="#ef4444" t="≥70 hot" /><Legend c="#f97316" t="55–69" /><Legend c="#38bdf8" t="45–54" /><Legend c="#ffffff" t="enriched (has contact)" ring />
          </div>
        </div>

        {/* right rail: filters + list / detail */}
        <aside>
          {sel ? (
            <Detail o={sel} onBack={() => setSel(null)} onCall={() => call(sel)} />
          ) : (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <Select label="Problem" value={sig} onChange={setSig} options={SIGNALS} />
                <Select label="Segment" value={seg} onChange={setSeg} options={SEGMENTS} />
              </div>
              <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted">
                <span>{filtered.length} opportunities · sorted by score</span>
                {(sig || seg) && <button onClick={() => { setSig(""); setSeg(""); }} className="text-accent">Reset</button>}
              </div>
              <div className="max-h-[58vh] space-y-2 overflow-auto pr-1">
                {filtered.map((p) => (
                  <button key={p.address} onClick={() => pick(p)} className="block w-full rounded-xl border border-card-border bg-card px-3.5 py-3 text-left transition hover:border-accent">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: scoreColor(p.score) }} />
                        {p.address}{p.qualified && <span className="text-emerald-400">✓</span>}
                      </span>
                      <span className="shrink-0 rounded-md bg-background/60 px-1.5 py-0.5 text-xs font-medium" style={{ color: scoreColor(p.score) }}>{p.score}</span>
                    </div>
                    <div className="mt-1.5 pl-[18px] text-xs text-muted">
                      {(p.signals || "—").replace(/,/g, ", ")}{p.systemAge ? ` · ~${p.systemAge}yr` : ""}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <p className="px-1 py-6 text-sm text-muted">No opportunities match these filters.</p>}
              </div>
            </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Detail({ o, onBack, onCall }: { o: MapOpportunity; onBack: () => void; onCall: () => void }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-xs text-muted transition hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to list</button>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-tight">{o.address}</h2>
        <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-300">Hot {o.score}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{o.segment}{o.systemAge ? ` · ~${o.systemAge}yr system` : ""}</p>

      <dl className="mt-4 space-y-2.5 text-sm">
        <Field k="Signals">{(o.signals || "—").replace(/,/g, ", ")}{o.acute ? ` · ${o.acute}× 311${o.open ? " (OPEN)" : ""}` : ""}</Field>
        {o.qualified && <Field k="Contact">✓ decision-maker found · {o.confidence}</Field>}
      </dl>

      {o.why && <p className="mt-4 rounded-xl bg-background/60 px-3.5 py-3 text-sm leading-relaxed text-foreground/90">{o.why}</p>}

      {o.qualified ? (
        <>
          <button onClick={onCall} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            <Phone className="h-4 w-4" /> Call decision-maker
          </button>
          <p className="mt-2 text-center text-[11px] text-muted">Opens the live call in Calls. Contact details withheld in public demo.</p>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted">Passes the score gate — contact lookup runs on the next pipeline pass.</p>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-card-border bg-card px-2.5 py-2 text-sm text-foreground outline-none transition focus:border-accent">
        <option value="">All</option>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
}
function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="flex gap-2"><dt className="w-[68px] shrink-0 text-muted">{k}</dt><dd className="flex-1 break-words">{children}</dd></div>;
}
function Legend({ c, t, ring }: { c: string; t: string; ring?: boolean }) {
  return <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: ring ? "transparent" : c, border: ring ? `2px solid ${c}` : "none" }} />{t}</span>;
}
