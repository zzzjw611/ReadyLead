import Link from "next/link";
import {
  Radio, Gauge, ShieldCheck, Network, Sparkles, PhoneCall,
  ArrowRight, ArrowDown, Check, User, Building2, MailCheck,
  RefreshCw, AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/Shell";

type Plat = { name: string; url?: string; domain?: string };
type Stage = {
  key: string; title: string; sub: string; icon: React.ElementType;
  cost: string; tone: "free" | "paid" | "soft";
  platforms: Plat[]; desc: string; out: string;
  steps?: { icon: React.ElementType; t: string; d: string }[];
};

const STAGES: Stage[] = [
  {
    key: "crawl", title: "Crawl", sub: "Find the list", icon: Radio, cost: "free · no key", tone: "free",
    platforms: [
      { name: "DataSF 311 · vw6y-z8j6", url: "https://data.sfgov.org/d/vw6y-z8j6", domain: "data.sfgov.org" },
      { name: "DataSF Permits · i98e-djp9", url: "https://data.sfgov.org/d/i98e-djp9", domain: "data.sfgov.org" },
      { name: "Business Reg · g8m3-pdis", url: "https://data.sfgov.org/d/g8m3-pdis", domain: "data.sfgov.org" },
    ],
    desc: "SoQL queries pull HVAC-need signals across the whole city. The three map categories all come from DataSF — two datasets:",
    out: "~11,600 re-scored each run",
    steps: [
      { icon: AlertCircle, t: "311 · active problem", d: "DataSF 311 (vw6y-z8j6) — no-heat / hot-water / mold / vent" },
      { icon: RefreshCw, t: "Replacement candidate", d: "DataSF Permits (i98e-djp9) — system ≥ 15 yr old" },
      { icon: Building2, t: "Commercial project", d: "DataSF Permits (i98e-djp9) — $1M+ mechanical filed" },
    ],
  },
  {
    key: "score", title: "Score", sub: "Multi-signal intent score", icon: Gauge, cost: "free", tone: "free",
    platforms: [{ name: "Python · self-written" }],
    desc: "Repeat complaints, OPEN / acute status, system age vs 15–20yr service life, and permitted scope roll into one score and a segment label.",
    out: "scored + segmented",
  },
  {
    key: "gate", title: "Gate", sub: "Protect the credits", icon: ShieldCheck, cost: "free", tone: "free",
    platforms: [{ name: "threshold · score ≥ 70" }],
    desc: "A hard gate. Paid enrichment never touches a weak building — only repeated, real HVAC intent gets through. This is what lets us scan the whole city without burning money.",
    out: "~13 qualified",
  },
  {
    key: "enrich", title: "Enrich", sub: "Contact waterfall", icon: Network, cost: "paid · gated", tone: "paid",
    platforms: [
      { name: "DeepLine · orchestration", url: "https://code.deepline.com", domain: "deepline.com" },
      { name: "Enformion · skip-trace", url: "https://www.enformion.com", domain: "enformion.com" },
      { name: "LeadMagic · validation", url: "https://leadmagic.io", domain: "leadmagic.io" },
    ],
    desc: "DeepLine runs a waterfall over only the qualified set to resolve the decision-maker:",
    out: "verified phone + email",
    steps: [
      { icon: User, t: "Person owner", d: "enformion_contact_enrich → phones + emails" },
      { icon: Building2, t: "LLC / entity", d: "business_search → officer → person_search → skip-trace" },
      { icon: MailCheck, t: "Validate", d: "leadmagic_email_validation → valid / invalid" },
    ],
  },
  {
    key: "rationale", title: "Rationale", sub: "Why it'll close", icon: Sparkles, cost: "LLM", tone: "soft",
    platforms: [{ name: "LLM" }],
    desc: "One evidence-backed line per opportunity — the signal, the system age, the legal pressure — so a rep can read it before dialing.",
    out: "1 line per lead",
  },
  {
    key: "outreach", title: "Outreach", sub: "Book the inspection", icon: PhoneCall, cost: "paid", tone: "paid",
    platforms: [
      { name: "Vapi · voice", url: "https://vapi.ai", domain: "vapi.ai" },
      { name: "Twilio · number", url: "https://www.twilio.com", domain: "twilio.com" },
      { name: "Google Calendar", url: "https://calendar.google.com", domain: "calendar.google.com" },
      { name: "Slack", url: "https://slack.com", domain: "slack.com" },
    ],
    desc: "The AI voice agent calls the owner, confirms person + address, introduces the company, books a free inspection on Google Calendar, and posts the win to Slack #new-hvac-lead.",
    out: "booked + notified",
  },
];

const FUNNEL = [
  { n: "~11,600", l: "re-scored / run" },
  { n: "400", l: "live on the map" },
  { n: "~13", l: "qualified / run" },
  { n: "~4", l: "reachable contact" },
];

const toneClass: Record<Stage["tone"], string> = {
  free: "border-positive/40 bg-positive/10 text-positive",
  paid: "border-accent/40 bg-accent/10 text-accent",
  soft: "border-card-border bg-background text-muted",
};

function favicon(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

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
      {inner}
      <ArrowRight className="h-3 w-3 -rotate-45 opacity-50" />
    </a>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

export default function PipelinePage() {
  return (
    <AppShell>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">From a city of public records to a booked HVAC inspection. Every platform links out.</p>
        </div>
        <Link href="/signals" className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
          See the live opportunities <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* cadence — the system is a renewable supply, not a one-off list */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p className="leading-6">
          <span className="font-medium text-foreground">Re-runs on a schedule (daily).</span>{" "}
          <span className="text-muted">~150 new HVAC signals land every month (~2,000 / year) — about 62 fresh 311 cases + 90 mechanical permits. It&apos;s a renewable supply that keeps refilling, not a one-time list.</span>
        </p>
      </div>

      {/* funnel */}
      <div className="mt-5 flex flex-wrap items-stretch gap-2">
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
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const last = i === STAGES.length - 1;
          return (
            <div key={s.key} className="relative flex gap-5 pb-7 last:pb-0">
              {/* spine */}
              <div className="relative flex flex-col items-center">
                <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent/30 bg-card text-accent shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                {!last && <span className="absolute top-12 bottom-[-14px] w-px bg-card-border" />}
              </div>

              {/* card */}
              <div className="flex-1 rounded-2xl border border-card-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xs font-medium text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
                  <span className="text-sm text-muted">· {s.sub}</span>
                  <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${toneClass[s.tone]}`}>{s.cost}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.platforms.map((p) => <Chip key={p.name} p={p} />)}
                </div>

                <p className="mt-3 text-sm leading-6 text-muted">{s.desc}</p>

                {s.steps && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {s.steps.map((st) => {
                      const SI = st.icon;
                      return (
                        <div key={st.t} className="rounded-xl border border-card-border bg-background p-3">
                          <div className="flex items-center gap-1.5 text-sm font-medium"><SI className="h-3.5 w-3.5 text-accent" /> {st.t}</div>
                          <p className="mt-1 text-xs leading-5 text-muted">{st.d}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
                  <ArrowDown className="h-3.5 w-3.5" /> {s.out}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* footnote */}
      <div className="mt-8 rounded-2xl border border-card-border bg-card/70 p-5">
        <p className="flex items-center gap-2 text-sm font-medium"><Check className="h-4 w-4 text-positive" /> Free where it scales, paid where it counts</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          The crawl and scoring are free and run on public data, so the funnel starts with the entire city.
          Paid steps (enrichment, the live call) only ever run on the gated few that already proved repeated HVAC intent —
          so coverage is city-wide while spend stays tiny. Full write-up in <span className="font-medium text-foreground/80">PIPELINE.md</span>.
        </p>
      </div>
    </AppShell>
  );
}
