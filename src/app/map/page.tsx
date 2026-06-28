"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { AppShell } from "@/components/Shell";
import { mapOpportunities, type MapOpportunity } from "@/data/mapOpportunities";

function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    const w = window as any;
    if (w.L) return resolve(w.L);
    if (!document.getElementById("leaflet-css")) {
      const css = document.createElement("link");
      css.id = "leaflet-css";
      css.rel = "stylesheet";
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

export default function MapPage() {
  const mapEl = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<MapOpportunity | null>(null);

  useEffect(() => {
    let map: any;
    (async () => {
      const L = await loadLeaflet();
      const el = mapEl.current as any;
      if (!el || el._leaflet_id) return;
      map = L.map(el, { scrollWheelZoom: true, attributionControl: false }).setView([37.773, -122.42], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      for (const p of mapOpportunities) {
        const m = L.circleMarker([p.lat, p.lng], {
          radius: p.qualified ? 11 : 6,
          color: p.qualified ? "#ffffff" : scoreColor(p.score),
          weight: p.qualified ? 2.5 : 1,
          fillColor: scoreColor(p.score),
          fillOpacity: 0.85,
        }).addTo(map);
        m.on("click", () => setSel(p));
        m.bindTooltip(`${p.address} · ${p.score}${p.qualified ? " · ✓" : ""}`);
      }
    })();
    return () => { if (map) map.remove(); };
  }, []);

  const qualified = mapOpportunities.filter((p) => p.qualified);

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Opportunity map</h1>
          <p className="text-sm text-muted">
            {mapOpportunities.length} SF buildings ranked by HVAC-need signals — chronic 311 complaints, aging systems, active permits.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <div ref={mapEl} className="h-[68vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-card-border" style={{ zIndex: 0 }} />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            <Legend c="#ef4444" t="score ≥ 70 (hot)" />
            <Legend c="#f97316" t="55–69" />
            <Legend c="#38bdf8" t="45–54" />
            <Legend c="#ffffff" t="enriched (has contact)" ring />
          </div>
        </div>

        <aside className="max-h-[74vh] overflow-auto">
          {sel ? (
            <div className="rounded-2xl border border-card-border bg-card p-4">
              <button onClick={() => setSel(null)} className="float-right text-muted transition hover:text-foreground">×</button>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: scoreColor(sel.score) }} />
                <h2 className="font-semibold">{sel.address}</h2>
              </div>
              <p className="mt-1 mb-3 text-xs text-muted">
                score <span className="font-semibold text-foreground">{sel.score}</span> · {sel.segment}
                {sel.systemAge ? ` · ~${sel.systemAge}yr system` : ""}
              </p>
              <Row k="Signals" v={`${sel.signals || "—"}${sel.acute ? ` (${sel.acute}× 311${sel.open ? ", OPEN" : ""})` : ""}`} />
              {sel.qualified ? (
                <>
                  <Row k="Contact" v={`✓ decision-maker found · ${sel.confidence}`} />
                  <p className="mt-3 rounded-xl bg-background/60 px-3 py-2.5 text-sm leading-relaxed text-foreground/90">{sel.why}</p>
                  <p className="mt-2 text-[11px] text-muted">Contact details withheld in public demo.</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">Passes the score gate — contact lookup runs on the next pipeline pass.</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-card-border bg-card p-4">
              <h2 className="font-semibold">Enriched & reachable ({qualified.length})</h2>
              <p className="mb-3 mt-1 text-xs text-muted">Click a building, or pick one below.</p>
              {qualified.map((p) => (
                <button
                  key={p.address}
                  onClick={() => setSel(p)}
                  className="mb-2 block w-full rounded-xl border border-card-border bg-background/40 px-3 py-2.5 text-left transition hover:border-accent"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.address}</span>
                    <span className="text-xs" style={{ color: scoreColor(p.score) }}>{p.score}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{p.segment} · ~{p.systemAge}yr</div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Legend({ c, t, ring }: { c: string; t: string; ring?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full" style={{ background: ring ? "transparent" : c, border: ring ? `2px solid ${c}` : "none" }} />
      {t}
    </span>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2 py-0.5 text-sm">
      <span className="w-[72px] shrink-0 text-muted">{k}</span>
      <span className="flex-1 break-words">{v}</span>
    </div>
  );
}
