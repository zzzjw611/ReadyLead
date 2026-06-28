import {
  Radio, Gauge, ShieldCheck, Network, PhoneCall, Sparkles,
  ArrowRight, ArrowDown, User, Building2, MailCheck, RefreshCw, AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/Shell";

type Plat = { name: string; url?: string; domain?: string };

const CRAWL_PLATFORMS: Plat[] = [
  { name: "DataSF 311 · vw6y-z8j6", url: "https://data.sfgov.org/d/vw6y-z8j6", domain: "data.sfgov.org" },
  { name: "DataSF Permits · i98e-djp9", url: "https://data.sfgov.org/d/i98e-djp9", domain: "data.sfgov.org" },
  { name: "Business Reg · g8m3-pdis", url: "https://data.sfgov.org/d/g8m3-pdis", domain: "data.sfgov.org" },
];
const ENRICH_PLATFORMS: Plat[] = [
  { name: "DeepLine · orchestration", url: "https://code.deepline.com", domain: "deepline.com" },
  { name: "Enformion · skip-trace", url: "https://www.enformion.com", domain: "enformion.com" },
  { name: "LeadMagic · validation", url: "https://leadmagic.io", domain: "leadmagic.io" },
];
const OUTREACH_PLATFORMS: Plat[] = [
  { name: "Vapi · voice", url: "https://vapi.ai", domain: "vapi.ai" },
  { name: "Twilio · number", url: "https://www.twilio.com", domain: "twilio.com" },
  { name: "Google Calendar", url: "https://calendar.google.com", domain: "calendar.google.com" },
  { name: "Slack", url: "https://slack.com", domain: "slack.com" },
];
const CATS = [
  { icon: AlertCircle, t: "311 · active problem", d: "DataSF 311 (vw6y-z8j6) — no-heat / hot-water / mold / vent" },
  { icon: RefreshCw, t: "Replacement candidate", d: "DataSF Permits (i98e-djp9) — system ≥ 15 yr old" },
  { icon: Building2, t: "Commercial project", d: "DataSF Permits (i98e-djp9) — $1M+ mechanical filed" },
];
const WATERFALL = [
  { icon: User, t: "Person owner", d: "enformion_contact_enrich → phones + emails" },
  { icon: Building2, t: "LLC / entity", d: "business_search → officer → person_search → skip-trace" },
  { icon: MailCheck, t: "Validate", d: "leadmagic_email_validation → valid / invalid" },
];
const FUNNEL = [
  { n: "~11,600", l: "re-scored / run" },
  { n: "400", l: "live on the map" },
  { n: "~13", l: "qualified / run" },
  { n: "~4", l: "reachable contact" },
];

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

function Chip({ p }: { p: Plat }) {
  const inner = (
    <>
      {p.domain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={favicon(p.domain)} alt="" width={14} height={14} className="h-3.5 w-3.5 rounded-sm" />
      )}
      {p.name}
    </>
  );
  const cls = "inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-background px-2.5 py-1 text-xs text-foreground/80";
  return p.url ? (
    <a href={p.url} target="_blank" rel="noreferrer" className={`${cls} transition hover:border-accent hover:text-foreground`}>
      {inner}<ArrowRight className="h-3 w-3 -rotate-45 opacity-50" />
    </a>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

function Out({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
      <ArrowDown className="h-3.5 w-3.5" /> {children}
    </div>
  );
}

function SubCards({ items }: { items: { icon: React.ElementType; t: string; d: string }[] }) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      {items.map((st) => {
        const SI = st.icon;
        return (
          <div key={st.t} className="rounded-xl border border-card-border bg-background p-3">
            <div className="flex items-center gap-1.5 text-sm font-medium"><SI className="h-3.5 w-3.5 text-accent" /> {st.t}</div>
            <p className="mt-1 text-xs leading-5 text-muted">{st.d}</p>
          </div>
        );
      })}
    </div>
  );
}

function Head({ n, title, sub, cost, tone }: { n: string; title: string; sub: string; cost: string; tone: "free" | "paid" }) {
  const tc = tone === "free" ? "border-positive/40 bg-positive/10 text-positive" : "border-accent/40 bg-accent/10 text-accent";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-xs font-medium text-muted">{n}</span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <span className="text-sm text-muted">· {sub}</span>
      <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tc}`}>{cost}</span>
    </div>
  );
}

function Node({ icon: Icon, last, children }: { icon: React.ElementType; last?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative flex gap-5 pb-7 last:pb-0">
      <div className="relative flex flex-col items-center">
        <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent/30 bg-card text-accent shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        {!last && <span className="absolute top-12 bottom-[-14px] w-px bg-card-border" />}
      </div>
      <div className="flex-1 rounded-2xl border border-card-border bg-card p-5">{children}</div>
    </div>
  );
}

export default function PipelinePage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>

      {/* cadence — one line */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
        <RefreshCw className="h-4 w-4 shrink-0 text-accent" />
        <p className="truncate">
          <span className="font-medium text-foreground">Re-runs daily</span>
          <span className="text-muted"> · ~150 new HVAC signals/month (~2,000/yr) — a renewable supply, not a one-off list.</span>
        </p>
      </div>

      {/* funnel */}
      <div className="mt-4 flex flex-wrap items-stretch gap-2">
        {FUNNEL.map((f, i) => (
          <div key={f.l} className="flex items-center gap-2">
            <div className="rounded-2xl border border-card-border bg-card px-5 py-3 text-center">
              <p className="text-2xl font-semibold tracking-tight">{f.n}</p>
              <p className="mt-0.5 text-[11px] text-muted">{f.l}</p>
            </div>
            {i < FUNNEL.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted" />}
          </div>
        ))}
      </div>

      {/* node flow */}
      <div className="mt-9">
        {/* 01 Crawl */}
        <Node icon={Radio}>
          <Head n="01" title="Crawl" sub="Find the list" cost="free · no key" tone="free" />
          <div className="mt-3 flex flex-wrap gap-1.5">{CRAWL_PLATFORMS.map((p) => <Chip key={p.name} p={p} />)}</div>
          <p className="mt-3 text-sm leading-6 text-muted">SoQL queries pull HVAC-need signals across the whole city. The three map categories all come from DataSF — two datasets:</p>
          <SubCards items={CATS} />
          <Out>~11,600 re-scored each run</Out>
        </Node>

        {/* 02 Score + Gate — combined */}
        <Node icon={Gauge}>
          <Head n="02" title="Score + Gate" sub="The free core" cost="free" tone="free" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-background p-3.5">
              <div className="flex items-center gap-2 text-sm font-medium"><Gauge className="h-4 w-4 text-accent" /> Score</div>
              <p className="mt-1.5 text-xs leading-5 text-muted">Repeat complaints, OPEN / acute status, system age vs 15–20yr life, and permitted scope → one score + a segment label.</p>
              <Out>scored + segmented</Out>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-3.5">
              <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-accent" /> Gate · score ≥ 70</div>
              <p className="mt-1.5 text-xs leading-5 text-muted">Paid enrichment never touches a weak building — only repeated, real HVAC intent passes. This is what lets us scan the whole city without burning money.</p>
              <Out>~13 qualified</Out>
            </div>
          </div>
        </Node>

        {/* 03 Enrich (+ rationale folded in) */}
        <Node icon={Network}>
          <Head n="03" title="Enrich" sub="Contact waterfall + rationale" cost="paid · gated" tone="paid" />
          <div className="mt-3 flex flex-wrap gap-1.5">{ENRICH_PLATFORMS.map((p) => <Chip key={p.name} p={p} />)}</div>
          <p className="mt-3 text-sm leading-6 text-muted">DeepLine runs a waterfall over only the qualified set to resolve the decision-maker:</p>
          <SubCards items={WATERFALL} />
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-card-border bg-background p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs leading-5 text-muted">
              <span className="font-medium text-foreground/90">Then rationale (LLM):</span> one evidence-backed line per lead — the signal, the system age, the legal pressure.
            </p>
          </div>
          <Out>verified contact + rationale</Out>
        </Node>

        {/* 04 Outreach */}
        <Node icon={PhoneCall} last>
          <Head n="04" title="Outreach" sub="Book the inspection" cost="paid" tone="paid" />
          <div className="mt-3 flex flex-wrap gap-1.5">{OUTREACH_PLATFORMS.map((p) => <Chip key={p.name} p={p} />)}</div>
          <p className="mt-3 text-sm leading-6 text-muted">The AI voice agent calls the owner, confirms person + address, introduces the company, books a free inspection on Google Calendar, and posts the win to Slack #new-hvac-lead.</p>
          <Out>booked + notified</Out>
        </Node>
      </div>
    </AppShell>
  );
}
