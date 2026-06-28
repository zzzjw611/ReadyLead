"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Phone, ArrowLeft, X, CalendarCheck, Loader2 } from "lucide-react";
import { AppShell } from "@/components/Shell";
import { mapOpportunities, type MapOpportunity } from "@/data/mapOpportunities";
import { company, simulatedTranscript, BOOKING_SLOTS } from "@/data/voiceAgent";
import { saveCall, type CallRecord } from "@/data/calls";

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
  { key: "mold", label: "Mold/vent" }, { key: "ventilation", label: "Ventilation" },
  { key: "plumbing", label: "Plumbing" }, { key: "electrical", label: "Electrical" },
];
const SEGMENTS = [
  { key: "commercial-repair", label: "Commercial repair" },
  { key: "residential-repair", label: "Residential repair" },
  { key: "commercial-project", label: "Commercial project" },
  { key: "replacement-candidate", label: "Replacement" },
];

export default function MapPage() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const byAddr = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<MapOpportunity | null>(null);
  const [sig, setSig] = useState<string | null>(null);
  const [seg, setSeg] = useState<string | null>(null);
  const [callOpp, setCallOpp] = useState<MapOpportunity | null>(null);

  const filtered = useMemo(() => {
    return mapOpportunities
      .filter((o) => (!sig || (o.signals || "").split(",").includes(sig)) && (!seg || o.segment === seg))
      .sort((a, b) => b.score - a.score);
  }, [sig, seg]);

  // init map once
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

  // redraw markers when filter changes
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
      m.on("click", () => setSel(p));
      m.bindTooltip(`${p.address} · ${p.score}${p.qualified ? " · ✓" : ""}`);
      m.addTo(layerRef.current);
      byAddr.current[p.address] = m;
    }
  }, [ready, filtered]);

  function pick(o: MapOpportunity) {
    setSel(o);
    const map = mapRef.current;
    if (map) map.flyTo([o.lat, o.lng], 15, { duration: 0.6 });
    const m = byAddr.current[o.address];
    if (m) m.openTooltip();
  }

  return (
    <AppShell>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white"><MapPin className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted">{filtered.length} SF buildings ranked by HVAC-need signals. Filter, then call the decision-maker.</p>
        </div>
      </div>

      {/* filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted">Problem</span>
        {SIGNALS.map((s) => (
          <Chip key={s.key} active={sig === s.key} onClick={() => setSig(sig === s.key ? null : s.key)}>{s.label}</Chip>
        ))}
        <span className="ml-3 text-xs uppercase tracking-wide text-muted">Segment</span>
        {SEGMENTS.map((s) => (
          <Chip key={s.key} active={seg === s.key} onClick={() => setSeg(seg === s.key ? null : s.key)}>{s.label}</Chip>
        ))}
        {(sig || seg) && <button onClick={() => { setSig(null); setSeg(null); }} className="text-xs text-accent">Clear</button>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div ref={mapEl} className="h-[64vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-card-border" style={{ zIndex: 0 }} />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            <Legend c="#ef4444" t="≥70 hot" /><Legend c="#f97316" t="55–69" /><Legend c="#38bdf8" t="45–54" /><Legend c="#ffffff" t="enriched" ring />
          </div>
        </div>

        <aside className="max-h-[72vh] overflow-auto">
          {sel ? (
            <div className="rounded-2xl border border-card-border bg-card p-4">
              <button onClick={() => setSel(null)} className="mb-2 flex items-center gap-1 text-xs text-muted hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to list</button>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: scoreColor(sel.score) }} />
                <h2 className="font-semibold">{sel.address}</h2>
              </div>
              <p className="mt-1 mb-3 text-xs text-muted">score <span className="font-semibold text-foreground">{sel.score}</span> · {sel.segment}{sel.systemAge ? ` · ~${sel.systemAge}yr system` : ""}</p>
              <Row k="Signals" v={`${sel.signals || "—"}${sel.acute ? ` (${sel.acute}× 311${sel.open ? ", OPEN" : ""})` : ""}`} />
              {sel.qualified ? (
                <>
                  <Row k="Contact" v={`✓ decision-maker found · ${sel.confidence}`} />
                  <p className="mt-3 rounded-xl bg-background/60 px-3 py-2.5 text-sm leading-relaxed text-foreground/90">{sel.why}</p>
                  <button onClick={() => setCallOpp(sel)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
                    <Phone className="h-4 w-4" /> Call with voice agent
                  </button>
                  <p className="mt-2 text-[11px] text-muted">Contact details withheld in public demo.</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">Passes the score gate — contact lookup runs on the next pipeline pass.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <button key={p.address} onClick={() => pick(p)} className="block w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-left transition hover:border-accent">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: scoreColor(p.score) }} />
                      {p.address}{p.qualified && <span className="text-emerald-400">✓</span>}
                    </span>
                    <span className="text-xs" style={{ color: scoreColor(p.score) }}>{p.score}</span>
                  </div>
                  <div className="mt-0.5 pl-4 text-xs text-muted">{p.segment} · {p.signals || "—"}{p.systemAge ? ` · ~${p.systemAge}yr` : ""}</div>
                </button>
              ))}
              {filtered.length === 0 && <p className="px-1 py-6 text-sm text-muted">No opportunities match these filters.</p>}
            </div>
          )}
        </aside>
      </div>

      {callOpp && <CallModal opp={callOpp} onClose={() => setCallOpp(null)} />}
    </AppShell>
  );
}

function CallModal({ opp, onClose }: { opp: MapOpportunity; onClose: () => void }) {
  const transcript = useMemo(() => simulatedTranscript(opp), [opp]);
  const [shown, setShown] = useState(0);
  const done = shown >= transcript.length;

  useEffect(() => {
    if (shown >= transcript.length) {
      const rec: CallRecord = {
        id: `call_${opp.address.replace(/\s+/g, "_")}_${Date.now()}`,
        address: opp.address, segment: opp.segment, score: opp.score,
        startedAt: "Just now", status: "completed", outcome: "booked", bookedFor: BOOKING_SLOTS[0],
        summary: `Reached decision-maker; booked a free inspection ${BOOKING_SLOTS[0]}.`, transcript,
      };
      saveCall(rec);
      return;
    }
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : 1400);
    return () => clearTimeout(t);
  }, [shown, transcript, opp]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-card-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white"><Phone className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold">{company.name} → {opp.address}</p>
              <p className="text-xs text-muted">{done ? "Call ended" : "Live call…"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[46vh] space-y-2 overflow-auto rounded-xl bg-background/50 p-3">
          {transcript.slice(0, shown).map((t, i) => (
            <div key={i} className={`flex ${t.speaker === "agent" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${t.speaker === "agent" ? "bg-accent/15" : "bg-card"}`}>
                <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted">{t.speaker === "agent" ? company.name : "Owner / manager"}</div>
                {t.text}
              </div>
            </div>
          ))}
          {!done && <div className="flex items-center gap-2 px-1 text-xs text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> agent speaking…</div>}
        </div>

        {done && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
            <span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4" /> Inspection booked · {BOOKING_SLOTS[0]}</span>
            <a href="/calls" className="text-accent">View in Calls →</a>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3 py-1 text-xs transition ${active ? "border-accent bg-accent/15 text-foreground" : "border-card-border text-muted hover:border-accent/60"}`}>{children}</button>
  );
}
function Legend({ c, t, ring }: { c: string; t: string; ring?: boolean }) {
  return <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: ring ? "transparent" : c, border: ring ? `2px solid ${c}` : "none" }} />{t}</span>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex gap-2 py-0.5 text-sm"><span className="w-[72px] shrink-0 text-muted">{k}</span><span className="flex-1 break-words">{v}</span></div>;
}
