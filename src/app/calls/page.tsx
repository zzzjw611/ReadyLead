"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Mail, Radio, Sparkles, CalendarCheck, Activity, User, BadgeCheck, RotateCcw, PhoneOff } from "lucide-react";
import { AppShell } from "@/components/Shell";
import {
  loadLeads, persistLeads, scriptFor, emailDraft, BOOKED_SLOT, AGENT_NAME,
  type Lead,
} from "@/data/calls";
import { fmtValue } from "@/lib/estimate";
import { deriveContact, DEMO_PHONE } from "@/lib/contact";
import { realContact } from "@/lib/contactsData";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function pill(l: Lead) {
  if (l.status === "queued") return { t: "Queued", c: "text-muted border-card-border bg-background/40", pulse: false };
  if (l.status === "dialing") return { t: "Dialing…", c: "text-accent border-accent/40 bg-accent-soft", pulse: true };
  if (l.status === "in_progress") return { t: `On call · ${l.durationSec}s`, c: "text-accent border-accent/40 bg-accent-soft", pulse: true };
  if (l.outcome === "booked") return { t: "Booked", c: "text-positive border-positive/40 bg-positive/10", pulse: false };
  if (l.outcome === "emailed") return { t: "Emailed", c: "text-accent border-accent/40 bg-accent-soft", pulse: false };
  if (l.outcome === "callback") return { t: "Callback", c: "text-muted border-card-border bg-background/40", pulse: false };
  return { t: "Done", c: "text-muted border-card-border bg-background/40", pulse: false };
}

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ id: string; subject: string; body: string } | null>(null);
  const mounted = useRef(true);
  const init = useRef(false);
  const polling = useRef<Set<string>>(new Set());

  function patch(id: string, p: Partial<Lead> | ((c: Lead) => Partial<Lead>)) {
    setLeads((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...(typeof p === "function" ? p(c) : p) } : c));
      persistLeads(next);
      return next;
    });
  }

  useEffect(() => {
    mounted.current = true;
    if (!init.current) {
      init.current = true;
      // unstick anything left mid-call when the user navigated away last time:
      // a real Vapi call (has vapiId) → resume polling; a sim with no vapiId → reset to queued so it's retryable.
      const loaded = loadLeads().map((l): Lead =>
        (l.status === "dialing" || l.status === "in_progress") && !l.vapiId
          ? { ...l, status: "queued", outcome: "pending", summary: "Added to outreach.", transcript: [], durationSec: 0 }
          : l
      );
      setLeads(loaded);
      persistLeads(loaded);
      setSelId(loaded[0]?.id ?? null);
      for (const l of loaded) {
        if ((l.status === "dialing" || l.status === "in_progress") && l.vapiId) pollVapi(l.id, l.vapiId);
      }
    }
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── place a real Vapi outbound call (falls back to a scripted sim if Vapi isn't set up) ──
  async function call(l: Lead) {
    setDraft(null);
    patch(l.id, { status: "dialing", outcome: "pending", summary: "Dialing the decision-maker…", transcript: [], durationSec: 0 });
    try {
      const res = await fetch("/api/vapi-call", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: l.address, signals: l.signals, systemAge: l.systemAge, why: l.why }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) {
        const reason = data.error || data.detail?.message || `Vapi error (HTTP ${res.status})`;
        if (res.status === 501) {
          // Vapi isn't configured at all → scripted demo, clearly labeled (no real call possible)
          patch(l.id, { summary: "Vapi not configured — running a scripted demo (not a real call)." });
          simulate(l.id);
        } else {
          // Vapi IS configured but the call was blocked/failed → show the truth, never a fake booking
          const isLimit = /daily|limit/i.test(reason);
          patch(l.id, {
            status: "completed", outcome: "callback", transcript: [], durationSec: 0, bookedFor: undefined,
            summary: isLimit
              ? "⚠ Real call blocked: Vapi daily outbound limit reached. It resets each day — or import a Twilio number into Vapi to remove the cap."
              : `⚠ Real call failed: ${reason}`,
          });
        }
        return;
      }
      patch(l.id, { vapiId: data.id, summary: `Ringing ${data.phone || ""}… (live Vapi call)` });
      pollVapi(l.id, data.id);
    } catch (e) {
      // network/parse error reaching our own API → show it, don't fake a successful call
      patch(l.id, { status: "completed", outcome: "callback", transcript: [], summary: `⚠ Couldn't reach the call API: ${(e as Error)?.message || "network error"}.` });
    }
  }

  async function pollVapi(id: string, vapiId: string) {
    if (polling.current.has(vapiId)) return; // already polling this call (e.g. resumed twice)
    polling.current.add(vapiId);
    let misses = 0; // consecutive bad/empty responses → give up rather than spin forever
    try {
      for (let i = 0; i < 320 && mounted.current; i++) {
        await delay(1200); // snappier live transcript (Vapi REST gives finalized lines)
        try {
          const d = await fetch(`/api/vapi-call?id=${vapiId}`).then((r) => r.json());
          if (!d || !d.status) { // error payload or expired id
            if (++misses >= 6) { patch(id, { status: "completed", outcome: "callback", summary: "Call ended (status unavailable)." }); return; }
            continue;
          }
          misses = 0;
          const ended = d.status === "ended";
          patch(id, (c) => ({
            status: ended ? "completed" : d.status === "in-progress" ? "in_progress" : "dialing",
            transcript: (d.messages?.length ? d.messages : c.transcript) as Lead["transcript"],
            durationSec: c.durationSec + 1,
          }));
          if (ended) {
            const sd = d.structuredData || {};
            const bo = String(sd.booking_outcome || ""); // assistant's field, e.g. "Booked for Monday, June 29 2026 8 PM"
            const txt = `${d.summary || ""} ${bo} ${(d.messages || []).map((m: any) => m.text).join(" ")}`.toLowerCase();
            const booked = typeof sd.booked === "boolean" ? sd.booked : (/^booked|booked for/i.test(bo) || /book|schedul|inspect|set up|come by/.test(txt));
            // the REAL agreed time, from either field
            const when = (sd.datetime as string) || (bo ? bo.replace(/^booked\s*(for)?\s*/i, "").trim() : "") || BOOKED_SLOT;
            const email = (sd.email as string) || bo.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] || undefined;
            patch(id, {
              outcome: booked ? "booked" : "callback",
              bookedFor: booked ? when : undefined,
              email,
              summary: d.summary || (booked ? `Booked an inspection — ${when}.` : "Call completed."),
            });
            return;
          }
        } catch { if (++misses >= 8) return; /* else keep polling through transient errors */ }
      }
    } finally {
      polling.current.delete(vapiId);
    }
  }

  async function simulate(id: string) {
    const l = leads.find((x) => x.id === id);
    const turns = scriptFor({ address: l?.address || "", signals: l?.signals, systemAge: l?.systemAge, why: l?.why });
    await delay(1600); if (!mounted.current) return;
    patch(id, { status: "in_progress", summary: "Connected — agent speaking…" });
    for (const t of turns) { await delay(1300); if (!mounted.current) return; patch(id, (c) => ({ transcript: [...c.transcript, t], durationSec: c.durationSec + 14 })); }
    await delay(700); if (!mounted.current) return;
    patch(id, { status: "completed", outcome: "booked", bookedFor: BOOKED_SLOT, summary: `Reached the decision-maker — booked a free inspection ${BOOKED_SLOT}.` });
  }

  function email(l: Lead) {
    const d = emailDraft(l);
    setDraft({ id: l.id, ...d });
    patch(l.id, { status: "completed", outcome: "emailed", summary: `Emailed — ${d.subject}` });
  }

  // cancel a finished lead's outcome (booking/callback/email) and place a fresh call
  function recall(l: Lead) {
    patch(l.id, { bookedFor: undefined, email: undefined, vapiId: undefined });
    call({ ...l, status: "queued", outcome: "pending", bookedFor: undefined, email: undefined, vapiId: undefined });
  }
  // just reset to queued without calling
  function reset(l: Lead) {
    setDraft(null);
    patch(l.id, { status: "queued", outcome: "pending", summary: "Added to outreach.", bookedFor: undefined, email: undefined, vapiId: undefined, transcript: [], durationSec: 0 });
  }

  const sel = leads.find((c) => c.id === selId) || null;

  return (
    <AppShell>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Outreach</h1>

      <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
        {/* leads */}
        <aside className="space-y-2">
          {leads.length === 0 && <p className="rounded-xl border border-card-border bg-card p-4 text-sm text-muted">No leads yet. Add some from <a href="/signals" className="text-accent">Signals</a>.</p>}
          {leads.map((c) => {
            const p = pill(c); const active = c.id === selId;
            return (
              <button key={c.id} onClick={() => { setSelId(c.id); setDraft(null); }}
                className={`block w-full rounded-xl border px-3 py-3 text-left transition ${active ? "border-accent bg-accent-soft" : "border-card-border bg-card hover:border-accent/50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.address}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${p.c}`}>
                    {p.pulse && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current align-middle" />}{p.t}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">{c.score}</span>
                  <span>~{fmtValue(c.estValue)}</span>
                  <span className="truncate">· {c.segment}</span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* detail */}
        <section>
          {!sel ? (
            <div className="rounded-2xl border border-card-border bg-card p-8 text-center text-sm text-muted">Pick a lead.</div>
          ) : (
            <div className="rounded-2xl border border-card-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{sel.address}</h2>
                  <p className="mt-0.5 text-sm text-muted">{sel.segment}{sel.systemAge ? ` · ~${sel.systemAge}yr system` : ""} · est. ~{fmtValue(sel.estValue)}</p>
                </div>
                <span className="rounded-md bg-accent-soft px-2.5 py-1 text-sm font-medium text-accent">{sel.score}</span>
              </div>

              {/* decision-maker contact */}
              <ContactCard l={sel} />

              {/* actions: queued → Call/Email · live → Cancel · finished → Call again */}
              <div className="mt-5 flex gap-2">
                {sel.status === "queued" ? (
                  <>
                    <button onClick={() => call(sel)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                      <Phone className="h-4 w-4" /> Call
                    </button>
                    <button onClick={() => email(sel)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-card-border bg-background/40 px-4 py-3 text-sm font-semibold transition hover:border-accent">
                      <Mail className="h-4 w-4" /> Email
                    </button>
                  </>
                ) : sel.status === "dialing" || sel.status === "in_progress" ? (
                  <button onClick={() => reset(sel)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-card-border bg-background/40 px-4 py-3 text-sm font-semibold text-muted transition hover:border-accent hover:text-foreground">
                    <PhoneOff className="h-4 w-4" /> Cancel call
                  </button>
                ) : (
                  <>
                    <button onClick={() => recall(sel)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                      <RotateCcw className="h-4 w-4" /> Call again
                    </button>
                    <button onClick={() => email(sel)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-card-border bg-background/40 px-4 py-3 text-sm font-semibold transition hover:border-accent">
                      <Mail className="h-4 w-4" /> Email
                    </button>
                  </>
                )}
              </div>

              {/* timeline */}
              <div className="mt-6 space-y-5">
                <Item icon={<Radio className="h-4 w-4" />} title="Signal detected" meta={sel.signals.replace(/,/g, ", ") || "311 / permit"}>
                  <p className="text-sm text-foreground/75">DataSF 311 + permit signals flagged this building.</p>
                </Item>
                <Item icon={<Sparkles className="h-4 w-4" />} title="Scored by AI" meta={`${sel.score}/100`}>
                  <p className="text-sm text-foreground/75">{sel.why || "High maintenance-opportunity score."}</p>
                </Item>
                <Item icon={sel.outcome === "emailed" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  title={sel.outcome === "emailed" ? "Email outreach" : "AI follow-up call"}
                  meta={sel.status === "queued" ? "not started" : sel.outcome === "emailed" ? "sent" : `${realContact(sel.address).phone || sel.phone || "—"} · ${sel.durationSec ? sel.durationSec + "s" : "—"}`} last>
                  {sel.status === "queued" ? (
                    <p className="text-sm text-muted">Choose Call or Email above.</p>
                  ) : sel.outcome === "emailed" ? (
                    <EmailView draft={draft?.id === sel.id ? draft : { id: sel.id, ...emailDraft(sel) }} />
                  ) : (
                    <CallView l={sel} />
                  )}
                </Item>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ContactCard({ l }: { l: Lead }) {
  const c = deriveContact(l);
  const real = realContact(l.address); // real enriched owner data (local-only, gitignored)
  const booked = l.outcome === "booked";
  const phone = real.phone || l.phone;            // prefer the actual captured number
  const email = real.email || l.email;            // prefer the actual captured email
  return (
    <div className="mt-4 rounded-xl border border-card-border bg-background/40 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4 text-muted" /> {real.name || "Decision-maker"}
        </span>
        {c.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-positive/40 bg-positive/10 px-2 py-0.5 text-[11px] text-positive">
            <BadgeCheck className="h-3 w-3" /> {c.verified === "email" ? "Verified email" : "Direct phone"}
          </span>
        ) : (
          <span className="rounded-full border border-card-border px-2 py-0.5 text-[11px] text-muted">Lookup pending</span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field icon={<User className="h-3.5 w-3.5" />} label="Role" value={c.role} />
        <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone"
          value={phone || "Captured on the call"}
          sub={phone ? "owner direct" : undefined}
          muted={!phone} />
        <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email"
          value={email || (booked ? "—" : "captured on the call")}
          sub={email ? (booked ? "invite sent" : "validated") : undefined}
          muted={!email} />
      </div>
      {booked && email && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-positive"><CalendarCheck className="h-3.5 w-3.5" /> Calendar invite sent to {email}</p>
      )}
      {!booked && <p className="mt-3 text-xs text-muted">{c.note}</p>}
      <p className="mt-1 text-[11px] text-muted/70">Demo: the live AI call rings {DEMO_PHONE}, not the owner.</p>
    </div>
  );
}

function Field({ icon, label, value, sub, muted }: { icon: React.ReactNode; label: string; value: string; sub?: string; muted?: boolean }) {
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">{icon} {label}</div>
      <div className={`mt-0.5 truncate text-sm ${muted ? "text-muted" : "font-medium"}`}>{value}</div>
      {sub && <div className="text-[10px] text-positive">{sub}</div>}
    </div>
  );
}

function CallView({ l }: { l: Lead }) {
  return (
    <div>
      <div className="mb-3 text-sm">
        {l.status === "dialing" && <span className="flex items-center gap-2 text-accent"><Activity className="h-4 w-4 animate-pulse" /> {l.summary}</span>}
        {l.status === "in_progress" && <span className="flex items-center gap-2 text-accent"><Activity className="h-4 w-4 animate-pulse" /> Live call · {AGENT_NAME}</span>}
        {l.status === "completed" && l.outcome === "booked" && <span className="flex items-center gap-2 text-positive"><CalendarCheck className="h-4 w-4" /> Call completed · inspection booked {l.bookedFor}</span>}
        {l.status === "completed" && l.outcome !== "booked" && <span className="text-muted">{l.summary}</span>}
      </div>
      {l.transcript.length > 0 && (
        <div className="space-y-2 rounded-xl bg-background/50 p-3">
          {l.transcript.map((t, i) => (
            <div key={i} className="text-sm">
              <span className={`mr-2 text-xs font-medium ${t.speaker === "agent" ? "text-accent" : "text-foreground/60"}`}>{t.speaker === "agent" ? AGENT_NAME : "Owner"}</span>
              <span className="text-foreground/90">{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailView({ draft }: { draft: { subject: string; body: string } }) {
  return (
    <div className="rounded-xl bg-background/50 p-3 text-sm">
      <div className="mb-2 border-b border-card-border pb-2"><span className="text-xs text-muted">Subject</span><div className="font-medium">{draft.subject}</div></div>
      <pre className="whitespace-pre-wrap font-sans text-foreground/85">{draft.body}</pre>
    </div>
  );
}

function Item({ icon, title, meta, children, last }: { icon: React.ReactNode; title: string; meta?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="relative flex gap-4">
      {!last && <span className="absolute left-[15px] top-9 bottom-[-20px] w-px bg-card-border" />}
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-accent">{icon}</span>
      <div className="flex-1 pb-1">
        <div className="flex items-center gap-2"><h3 className="font-medium">{title}</h3>{meta && <span className="text-xs text-muted">· {meta}</span>}</div>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}
