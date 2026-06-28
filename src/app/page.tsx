import Link from "next/link";
import {
  ArrowRight, Radio, FileText, Building2, ShieldCheck, Users, Sparkles,
  PhoneCall, CalendarCheck, ThermometerSun, Clock, RefreshCw, MapPin,
} from "lucide-react";
import { AppShell } from "@/components/Shell";
import { Card } from "@/components/Card";

// Real figures from the latest pipeline run (free public-data crawl + scoring).
const STATS = {
  inflow: "~150",        // new HVAC signals per month (62 311 + 90 permits) — ~2,000/yr
  scored: "11,578",      // SF buildings re-scored each run
  live: "400",           // highest-signal opportunities on the map
  qualified: "19",       // cleared the score>=70 gate into paid enrichment
  pipeline: "$15.2M",    // sum of estimated deal value across the 400
  median: "$22k",        // median estimated deal value
  over50k: "33",         // opportunities estimated over $50k
};

// The pipeline the user sees on the map — crawl → score → gate → enrich → rationale → outreach.
const PIPELINE = [
  {
    icon: Radio, tag: "Crawl", cost: "free · public APIs",
    title: "Pull every maintenance signal in SF",
    body: "DataSF 311 cases (no-heat, mold, ventilation, hot-water), building permits, and DBI records — refreshed on a schedule.",
    out: "11,578 buildings",
  },
  {
    icon: ThermometerSun, tag: "Score", cost: "free",
    title: "Multi-signal opportunity score",
    body: "Repeat complaints, open/acute status, system age vs 15–20yr service life, and live permitted scope roll up into one score + a segment label.",
    out: "ranked + segmented",
  },
  {
    icon: ShieldCheck, tag: "Gate", cost: "protects credits",
    title: "Only score ≥ 70 passes",
    body: "A hard threshold gate. We never spend enrichment credits on weak buildings — only the ones with real, repeated HVAC intent get through.",
    out: "19 qualified",
  },
  {
    icon: Users, tag: "Contact waterfall", cost: "paid · gated",
    title: "Resolve the named decision-maker",
    body: "DataSF business registration → Enformion skip-trace → LeadMagic email validation. LLCs resolve to an officer, then a person. Self-managed vs property-managed is inferred from the email domain.",
    out: "verified phone + email",
  },
  {
    icon: Sparkles, tag: "Rationale", cost: "LLM",
    title: "Auto 'why it'll close'",
    body: "Each qualified opportunity gets a one-line, evidence-backed reason a contractor can read before dialing — the signal, the age, the legal pressure.",
    out: "1 line per lead",
  },
  {
    icon: PhoneCall, tag: "Outreach", cost: "Vapi voice",
    title: "AI agent books the inspection",
    body: "The voice agent calls the owner, books a free 30-min inspection on Google Calendar with their email, and posts the win to Slack #new-hvac-lead.",
    out: "booked + notified",
  },
];

const WHY = [
  {
    icon: ThermometerSun,
    title: "HVAC demand is event-driven",
    body: "Nobody shops for a contractor until something breaks. A no-heat report, a mold/ventilation complaint, or a 15–20yr-old system are public events that fire before the owner starts calling around.",
  },
  {
    icon: Users,
    title: "It's a named owner, not a list",
    body: "Every qualified building resolves to a reachable decision-maker. So outreach is 'this building, this problem, this owner, today' — not a cold blast.",
  },
  {
    icon: Clock,
    title: "Timing is the edge",
    body: "An OPEN 311 habitability complaint means the landlord is legally on the hook right now. That's the moment a free inspection actually gets a yes.",
  },
];

export default function Home() {
  return (
    <AppShell>
      {/* hero */}
      <section className="grid min-h-[70vh] items-center gap-10 py-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent">
            <MapPin className="h-3.5 w-3.5" /> HVAC GTM signal engine · San Francisco
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Find the buildings that need HVAC work — before the owner calls anyone.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            ReadyLead crawls SF&apos;s public maintenance records, scores every building for HVAC
            intent, enriches the decision-maker for the ones that clear the bar, and lets an
            AI voice agent book the inspection. All from signals a contractor can&apos;t see anywhere else.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signals" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition hover:opacity-90">
              See the live opportunities <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#pipeline" className="inline-flex items-center gap-2 rounded-full border border-card-border px-6 py-3 font-medium text-muted transition hover:border-accent hover:text-foreground">
              How it works
            </a>
          </div>
        </div>

        <Card className="bg-card/80">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Re-scored daily</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat n={STATS.inflow} l="new signals / month" accent />
            <Stat n={STATS.live} l="live opportunities" />
            <Stat n={STATS.pipeline} l="est. pipeline value" />
            <Stat n={STATS.qualified} l="cleared the gate / run" />
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <RefreshCw className="h-3.5 w-3.5" /> ~{STATS.scored} re-scored every run · ~2,000 fresh HVAC signals a year — a renewable supply
          </p>
        </Card>
      </section>

      {/* pipeline */}
      <section id="pipeline" className="py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">The pipeline</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Crawl → score → gate → enrich → call.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            The crawl and scoring are free and run on public data, so we can look at the whole city.
            Paid enrichment only ever touches buildings that already proved repeated HVAC intent.
          </p>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <h3 className="font-semibold">{s.tag}</h3>
                  <span className="rounded-full border border-card-border px-2 py-0.5 text-[10px] text-muted">{s.cost}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground/90">{s.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{s.body}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-background/60 px-2.5 py-1 text-xs text-accent">
                  <ArrowRight className="h-3 w-3" /> {s.out}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* why it works */}
      <section className="py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Why public signals find HVAC buyers</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            The city tells you who&apos;s about to need a contractor.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {WHY.map((w) => {
            const Icon = w.icon;
            return (
              <Card key={w.title}>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{w.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{w.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* volume / is this enough */}
      <section className="py-14">
        <Card className="border-accent/20 bg-card/80">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Is the volume enough to run a business on?</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                One city, refreshed daily, already fills a contractor&apos;s calendar.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                400 live opportunities in SF alone add up to {STATS.pipeline} of estimated pipeline,
                with a median deal around {STATS.median} and {STATS.over50k} jobs over $50k. And it doesn&apos;t run dry:
                the crawl is free and re-runs daily, with ~150 new HVAC signals (~2,000 a year) flowing in —
                a renewable supply, not a one-time list. The same engine drops onto any city with open 311 + permit data.
              </p>
              <Link href="/signals" className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-90">
                Open the map <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat n={STATS.inflow} l="new signals / month" big accent />
              <Stat n={STATS.pipeline} l="estimated pipeline" big />
              <Stat n={STATS.median} l="median deal value" big />
              <Stat n={STATS.over50k} l="jobs over $50k" big />
            </div>
          </div>
        </Card>
      </section>

      {/* closing */}
      <section className="py-14">
        <Card className="border-accent/30 bg-accent/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-accent">
                <CalendarCheck className="h-4 w-4" /> Signal to booked inspection
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Real data, real call, real calendar invite. Owner emails and phones are resolved by the
                waterfall but kept out of this public repo — the live demo captures the email on the call.
              </p>
            </div>
            <Link href="/signals" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-90">
              Start the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

function Stat({ n, l, accent, big }: { n: string; l: string; accent?: boolean; big?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-accent/40 bg-accent/10" : "border-card-border bg-background/60"}`}>
      <p className={`font-semibold ${big ? "text-3xl" : "text-2xl"} ${accent ? "text-accent" : ""}`}>{n}</p>
      <p className="mt-1 text-xs text-muted">{l}</p>
    </div>
  );
}
