"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Plus } from "lucide-react";
import { AppShell } from "@/components/Shell";
import { mapOpportunities, type MapOpportunity } from "@/data/mapOpportunities";
import { estimateValue, fmtValue } from "@/lib/estimate";
import { deriveContact } from "@/lib/contact";
import { queueLead } from "@/data/calls";
import {
  CATEGORY_META, CATEGORY_ORDER, category, categoryColor, categoryLabel,
  SIGNAL_META, SIGNAL_ORDER,
} from "@/lib/signals";

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

export default function SignalsPage() {
  const router = useRouter();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const byAddr = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<MapOpportunity | null>(null);
  const [cat, setCat] = useState("");
  const [prob, setProb] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => mapOpportunities
      .filter((o) =>
        (!cat || category(o.segment) === cat) &&
        (!prob || (o.signals || "").split(",").includes(prob)))
      .sort((a, b) => b.score - a.score),
    [cat, prob]
  );

  useEffect(() => {
    let map: any = null;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    (async () => {
      const L = await loadLeaflet();
      if (cancelled) return;
      const el = mapEl.current as any;
      if (!el || el._leaflet_id) return; // a map already lives on this element
      map = L.map(el, { scrollWheelZoom: true, attributionControl: false }).setView([37.773, -122.42], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
      // A flex/grid container often gets its real height AFTER the map inits.
      // Without this, Leaflet keeps a stale 0-size and projecting a click throws
      // "Cannot read properties of undefined (reading 'x')". Re-measure on resize.
      const fix = () => { try { map && map.invalidateSize(false); } catch { /* ignore */ } };
      fix();
      ro = new ResizeObserver(fix);
      ro.observe(el);
    })();
    return () => {
      cancelled = true;
      try { ro?.disconnect(); } catch { /* ignore */ }
      try { map?.remove(); } catch { /* ignore */ }
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready || !layerRef.current) return;
    const L = (window as any).L;
    layerRef.current.clearLayers();
    byAddr.current = {};
    for (const p of filtered) {
      const col = categoryColor(p.segment);
      const m = L.circleMarker([p.lat, p.lng], { radius: 7, color: col, weight: 1, fillColor: col, fillOpacity: 0.9 });
      m.on("click", () => setSel(p));
      m.addTo(layerRef.current);
      byAddr.current[p.address] = m;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, filtered]);

  function pick(o: MapOpportunity) {
    setSel(o);
    const map = mapRef.current;
    if (!map) return;
    // never let a map animation hiccup crash the page — opening the detail is what matters
    try { map.invalidateSize(false); map.flyTo([o.lat, o.lng], 15, { duration: 0.6 }); }
    catch { try { map.setView([o.lat, o.lng], 15, { animate: false }); } catch { /* ignore */ } }
  }
  function add(o: MapOpportunity) {
    queueLead(o);
    setAdded((s) => new Set(s).add(o.address));
  }

  return (
    <AppShell>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Signals</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-card-border">
            <div ref={mapEl} className="h-[66vh] min-h-[440px] w-full" style={{ zIndex: 0 }} />
            <div className={`absolute inset-y-0 left-0 z-[1000] w-[330px] max-w-[86%] p-3 transition-transform duration-300 ${sel ? "translate-x-0" : "-translate-x-[115%]"}`}>
              {sel && <Detail o={sel} added={added.has(sel.address)} onClose={() => setSel(null)} onAdd={() => add(sel)} onGo={() => router.push("/calls")} />}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            {CATEGORY_ORDER.map((k) => <Dot key={k} c={CATEGORY_META[k].color} t={CATEGORY_META[k].label} />)}
          </div>
        </div>

        <aside>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Select label="Category" value={cat} onChange={(v) => { setCat(v); if (v !== "311") setProb(""); }}
              options={CATEGORY_ORDER.map((k) => ({ key: k, label: CATEGORY_META[k].label }))} />
            <Select label="Problem (311)" value={prob} onChange={setProb} disabled={cat !== "" && cat !== "311"}
              options={SIGNAL_ORDER.map((k) => ({ key: k, label: SIGNAL_META[k].label }))} />
          </div>
          <div className="max-h-[62vh] space-y-2 overflow-auto pr-1">
            {filtered.map((p) => {
              const v = estimateValue({ segment: p.segment, score: p.score, systemAge: p.systemAge });
              const active = sel?.address === p.address;
              return (
                <button key={p.address} onClick={() => pick(p)}
                  className={`block w-full rounded-xl border bg-card px-3.5 py-3 text-left transition ${active ? "border-accent" : "border-card-border hover:border-accent/50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: categoryColor(p.segment) }} />
                      {p.address}
                    </span>
                    <span className="shrink-0 rounded-md border border-card-border bg-background px-1.5 py-0.5 text-xs font-medium text-muted">{p.score}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 pl-[18px] text-xs text-muted">
                    <span className="rounded bg-background px-1.5 py-0.5">~{fmtValue(v)}</span>
                    <span className="truncate">{categoryLabel(p.segment)}{p.signals ? ` · ${(p.signals).replace(/,/g, ", ")}` : ""}</span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="px-1 py-6 text-sm text-muted">No opportunities match these filters.</p>}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Detail({ o, added, onClose, onAdd, onGo }: { o: MapOpportunity; added: boolean; onClose: () => void; onAdd: () => void; onGo: () => void }) {
  const v = estimateValue({ segment: o.segment, score: o.score, systemAge: o.systemAge });
  const col = categoryColor(o.segment);
  const contact = deriveContact(o);
  return (
    <div className="flex h-full max-h-full flex-col overflow-auto rounded-xl border border-card-border bg-card shadow-xl">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${col}1a`, color: col }}>
            <span className="h-2 w-2 rounded-full" style={{ background: col }} />
            {categoryLabel(o.segment)}
          </span>
          <button onClick={onClose} className="text-muted transition hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold leading-tight">{o.address}</h2>
          <span className="shrink-0 rounded-md border border-card-border bg-background px-1.5 py-0.5 text-sm font-medium text-muted">{o.score}</span>
        </div>
        <p className="mt-1 text-xs text-muted">{o.segment}{o.systemAge ? ` · ~${o.systemAge}yr system` : ""}</p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Box k="Est. value" v={`~${fmtValue(v)}`} />
          <Box k="Decision-maker" v={contact.role} />
          <Box k="Problem" v={o.signals ? (o.signals).replace(/,/g, ", ") : "—"} />
          <Box k="Contact" v={contact.verified === "email" ? "Verified email" : contact.verified === "phone" ? "Direct phone" : "On the call"} />
        </div>
        {o.qualified && contact.verified && <p className="mt-2 text-xs text-positive">✓ {contact.note}</p>}
        {o.why && <p className="mt-3 rounded-xl bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground/80">{o.why}</p>}
      </div>

      <div className="mt-auto border-t border-card-border p-3">
        {added ? (
          <button onClick={onGo} className="flex w-full items-center justify-center gap-2 rounded-xl border border-positive/40 bg-positive/10 px-4 py-2.5 text-sm font-semibold text-positive">
            <Check className="h-4 w-4" /> Added — go to Outreach
          </button>
        ) : (
          <button onClick={onAdd} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            <Plus className="h-4 w-4" /> Add to Outreach
          </button>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: { key: string; label: string }[]; disabled?: boolean }) {
  return (
    <label className={`block ${disabled ? "opacity-50" : ""}`}>
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-card-border bg-card px-2 py-2 text-sm text-foreground outline-none transition focus:border-accent disabled:cursor-not-allowed">
        <option value="">All</option>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
}
function Box({ k, v }: { k: string; v: string }) {
  return <div className="rounded-lg border border-card-border bg-background px-3 py-2"><div className="text-[11px] text-muted">{k}</div><div className="mt-0.5 truncate text-sm">{v}</div></div>;
}
function Dot({ c, t }: { c: string; t: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: c }} />{t}</span>;
}
