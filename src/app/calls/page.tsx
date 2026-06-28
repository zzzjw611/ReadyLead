"use client";

import { useEffect, useState } from "react";
import { Phone, CalendarCheck, PhoneMissed, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/Shell";
import { loadCalls, type CallRecord } from "@/data/calls";

const outcomeBadge: Record<string, { label: string; cls: string; Icon: typeof Phone }> = {
  booked: { label: "Inspection booked", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", Icon: CalendarCheck },
  callback: { label: "Callback", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", Icon: RotateCcw },
  not_interested: { label: "Not interested", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30", Icon: PhoneMissed },
  pending: { label: "In progress", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30", Icon: Phone },
};

export default function CallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { setCalls(loadCalls()); }, []);

  const booked = calls.filter((c) => c.outcome === "booked").length;

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
          <Phone className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calls</h1>
          <p className="text-sm text-muted">
            Voice-agent outbound — {calls.length} calls, <span className="text-emerald-300">{booked} inspections booked</span>.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {calls.length === 0 && (
          <div className="rounded-2xl border border-card-border bg-card p-6 text-sm text-muted">
            No calls yet. Open the <a href="/map" className="text-accent">map</a>, pick an opportunity, and hit “Call with voice agent”.
          </div>
        )}
        {calls.map((c) => {
          const b = outcomeBadge[c.outcome] ?? outcomeBadge.pending;
          const isOpen = open === c.id;
          return (
            <div key={c.id} className="rounded-2xl border border-card-border bg-card">
              <button onClick={() => setOpen(isOpen ? null : c.id)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${b.cls}`}>
                  <b.Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.address}</span>
                    <span className="text-xs text-muted">· score {c.score} · {c.segment}</span>
                  </div>
                  <div className="truncate text-xs text-muted">{c.summary}</div>
                </div>
                <div className="text-right">
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${b.cls}`}>{b.label}</span>
                  <div className="mt-1 text-[11px] text-muted">{c.bookedFor ? `→ ${c.bookedFor}` : c.startedAt}</div>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-card-border px-4 py-4">
                  <div className="space-y-2">
                    {c.transcript.map((t, i) => (
                      <div key={i} className={`flex ${t.speaker === "agent" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${t.speaker === "agent" ? "bg-accent/15 text-foreground" : "bg-background/70 text-foreground/90"}`}>
                          <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted">{t.speaker === "agent" ? "Summit Mechanical" : "Owner / manager"}</div>
                          {t.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
