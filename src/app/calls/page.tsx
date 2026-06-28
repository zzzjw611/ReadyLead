"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, CalendarCheck, RotateCcw, Activity, Radio, Sparkles, FileText } from "lucide-react";
import { AppShell } from "@/components/Shell";
import {
  loadCalls, persistCalls, makeCall, scriptFor, BOOKED_SLOT, AGENT_NAME,
  type CallRecord,
} from "@/data/calls";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function statusPill(c: CallRecord) {
  if (c.status === "dialing") return { label: "Dialing…", cls: "text-amber-300 border-amber-500/40 bg-amber-500/10", pulse: true };
  if (c.status === "in_progress") return { label: `On call · ${c.durationSec}s`, cls: "text-sky-300 border-sky-500/40 bg-sky-500/10", pulse: true };
  if (c.outcome === "booked") return { label: "Booked", cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10", pulse: false };
  if (c.outcome === "callback") return { label: "Callback", cls: "text-amber-300 border-amber-500/40 bg-amber-500/10", pulse: false };
  return { label: "Done", cls: "text-slate-300 border-slate-500/40 bg-slate-500/10", pulse: false };
}

const PENDING_KEY = "readylead_pending_call";

export default function CallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const mounted = useRef(true);
  const initDone = useRef(false);
  const animating = useRef<Set<string>>(new Set());

  function patch(id: string, p: Partial<CallRecord> | ((c: CallRecord) => Partial<CallRecord>)) {
    setCalls((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...(typeof p === "function" ? p(c) : p) } : c));
      persistCalls(next);
      return next;
    });
  }

  async function runAnim(rec: CallRecord) {
    const turns = scriptFor({ address: rec.address, signals: rec.signals, systemAge: rec.systemAge, segment: rec.segment, why: rec.why });
    await delay(1700); if (!mounted.current) return;
    patch(rec.id, { status: "in_progress", summary: "Connected — agent speaking…" });
    for (const t of turns) {
      await delay(1300); if (!mounted.current) return;
      patch(rec.id, (c) => ({ transcript: [...c.transcript, t], durationSec: c.durationSec + 14 }));
    }
    await delay(800); if (!mounted.current) return;
    patch(rec.id, { status: "completed", outcome: "booked", bookedFor: BOOKED_SLOT, summary: `Reached the decision-maker — booked a free inspection ${BOOKED_SLOT}.` });
  }

  function startCall(o: { address: string; score?: number; segment?: string; signals?: string; systemAge?: string; why?: string }) {
    const rec = makeCall(o);
    setCalls((prev) => { const next = [rec, ...prev]; persistCalls(next); return next; });
    setSelId(rec.id);
  }

  // init once: load existing + any pending call placed from the map
  useEffect(() => {
    mounted.current = true;
    if (!initDone.current) {
      initDone.current = true;
      let loaded = loadCalls();
      let sel = loaded[0]?.id ?? null;
      try {
        const raw = window.localStorage.getItem(PENDING_KEY);
        if (raw) {
          window.localStorage.removeItem(PENDING_KEY);
          const rec = makeCall(JSON.parse(raw));
          loaded = [rec, ...loaded];
          persistCalls(loaded);
          sel = rec.id;
        }
      } catch { /* ignore */ }
      setCalls(loaded);
      setSelId(sel);
    }
    return () => { mounted.current = false; };
  }, []);

  // drive the dialing animation for any call still in "dialing" (idempotent per id)
  useEffect(() => {
    for (const c of calls) {
      if (c.status === "dialing" && !animating.current.has(c.id)) {
        animating.current.add(c.id);
        runAnim(c);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calls]);

  const sel = calls.find((c) => c.id === selId) || null;
  const booked = calls.filter((c) => c.outcome === "booked").length;

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white"><Phone className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calls</h1>
          <p className="text-sm text-muted">{calls.length} voice-agent calls · <span className="text-emerald-300">{booked} inspections booked</span></p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* leads / calls list */}
        <aside className="space-y-2">
          {calls.map((c) => {
            const p = statusPill(c);
            const active = c.id === selId;
            return (
              <button key={c.id} onClick={() => setSelId(c.id)}
                className={`block w-full rounded-xl border px-3 py-3 text-left transition ${active ? "border-accent bg-accent/10" : "border-card-border bg-card hover:border-accent/50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.address}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${p.cls}`}>
                    {p.pulse && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current align-middle" />}{p.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-red-300">Hot {c.score}</span>
                  <span className="truncate">{c.segment}</span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* timeline detail */}
        <section>
          {!sel ? (
            <div className="rounded-2xl border border-card-border bg-card p-8 text-center text-sm text-muted">
              No calls yet. Open the <a href="/map" className="text-accent">map</a>, pick an opportunity, and hit Call.
            </div>
          ) : (
            <div className="rounded-2xl border border-card-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{sel.address}</h2>
                  <p className="mt-0.5 text-sm text-muted">{sel.segment}{sel.systemAge ? ` · ~${sel.systemAge}yr system` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-300">Hot {sel.score}/100</span>
                  <button onClick={() => startCall(sel)} className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition hover:opacity-90">
                    <Phone className="h-3.5 w-3.5" /> Call now
                  </button>
                </div>
              </div>

              {/* timeline */}
              <div className="mt-6 space-y-5">
                <TimelineItem icon={<Radio className="h-4 w-4" />} title="Signal detected" tone="sky"
                  meta={sel.signals ? `${sel.signals.replace(/,/g, ", ")}` : "building-system 311"}>
                  <p className="text-sm text-foreground/80">DataSF 311 + permit signals flagged this building.</p>
                </TimelineItem>

                <TimelineItem icon={<Sparkles className="h-4 w-4" />} title="Scored by AI" tone="violet"
                  meta={`Hot ${sel.score}/100`}>
                  <p className="text-sm text-foreground/80">{sel.why || "High maintenance-opportunity score."}</p>
                </TimelineItem>

                <TimelineItem icon={<Phone className="h-4 w-4" />} title="AI follow-up call" tone="orange" last
                  meta={`${sel.phone} · ${sel.durationSec ? `${sel.durationSec}s` : "—"}`}>
                  <CallBody c={sel} />
                </TimelineItem>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function CallBody({ c }: { c: CallRecord }) {
  return (
    <div>
      <div className="mb-3 text-sm">
        {c.status === "dialing" && <span className="flex items-center gap-2 text-amber-300"><Activity className="h-4 w-4 animate-pulse" /> Dialing {c.phone}…</span>}
        {c.status === "in_progress" && <span className="flex items-center gap-2 text-sky-300"><Activity className="h-4 w-4 animate-pulse" /> Live call · {AGENT_NAME}</span>}
        {c.status === "completed" && c.outcome === "booked" && <span className="flex items-center gap-2 text-emerald-300"><CalendarCheck className="h-4 w-4" /> Call completed · inspection booked {c.bookedFor}</span>}
        {c.status === "completed" && c.outcome === "callback" && <span className="flex items-center gap-2 text-amber-300"><RotateCcw className="h-4 w-4" /> Call completed · callback</span>}
      </div>
      {c.transcript.length > 0 && (
        <div className="space-y-2 rounded-xl bg-background/50 p-3">
          {c.transcript.map((t, i) => (
            <div key={i} className="text-sm">
              <span className={`mr-2 text-xs font-medium ${t.speaker === "agent" ? "text-accent" : "text-sky-300"}`}>
                {t.speaker === "agent" ? AGENT_NAME : "Owner"}
              </span>
              <span className="text-foreground/90">{t.text}</span>
            </div>
          ))}
        </div>
      )}
      {c.transcript.length === 0 && c.status === "dialing" && <p className="text-sm text-muted">Connecting…</p>}
    </div>
  );
}

const TONE: Record<string, string> = {
  sky: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  violet: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  orange: "border-accent/50 bg-accent/10 text-accent",
};

function TimelineItem({ icon, title, meta, tone, children, last }: { icon: React.ReactNode; title: string; meta?: string; tone: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="relative flex gap-4">
      {!last && <span className="absolute left-[15px] top-9 bottom-[-20px] w-px bg-card-border" />}
      <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${TONE[tone]}`}>{icon}</span>
      <div className="flex-1 pb-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{title}</h3>
          {meta && <span className="text-xs text-muted">· {meta}</span>}
        </div>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}
