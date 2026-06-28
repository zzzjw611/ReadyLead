import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Database,
  FileText,
  Mail,
  Route,
  Sparkles,
  Target,
  ThermometerSun,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/Shell";
import { Card } from "@/components/Card";

const painCards = [
  {
    title: "Reactive lead channels",
    body: "Google Ads, Yelp, Angi, and referrals only appear after the customer already has a problem.",
  },
  {
    title: "No early demand signal",
    body: "Contractors cannot see which buildings are likely to need maintenance soon.",
  },
  {
    title: "Contact path is unclear",
    body: "Even when a building looks promising, teams still need to find the right property manager, facility contact, or leasing office.",
  },
];

const agents = [
  {
    title: "Signal Scoring Agent",
    icon: ThermometerSun,
    body: "Scores maintenance opportunity using building age, permits, reviews, HOA notes, weather stress, and plan-extracted systems.",
  },
  {
    title: "Contact Path Agent",
    icon: Route,
    body: "Ranks the best way to reach the decision maker: property website, leasing office, permit contact, management company, or LinkedIn path.",
  },
  {
    title: "Contractor Matching Agent",
    icon: Wrench,
    body: "Matches HVAC contractors by trade, service area, specialty, and building type.",
  },
  {
    title: "Outreach Draft Agent",
    icon: Mail,
    body: "Generates cautious, evidence-backed outreach for contractor sales teams.",
  },
];

const architecture = [
  "Data Sources",
  "Convex DB",
  "Signal Scoring Agent",
  "Contact Path Agent",
  "Contractor Matching Agent",
  "Outreach Draft Agent",
  "Dashboard",
];

const demoSteps = [
  "Open the Building Opportunity Board.",
  "Review AI-ranked HVAC maintenance opportunities.",
  "Open Mission Creek Residences.",
  "Review evidence, contact path, matched contractors, and outreach draft.",
  "Click “Add New HOA Signal.”",
  "Watch the risk score jump from around 72 to 92.",
  "See the building become a Hot opportunity and outreach update.",
];

const sponsors = [
  {
    name: "OpenAI",
    body: "Signal reasoning and outreach drafting path.",
  },
  {
    name: "Convex",
    body: "Real-time database and dashboard re-ranking.",
  },
  {
    name: "Orange Slice",
    body: "Optional contact enrichment adapter with Orange Slice-style enrichment.",
  },
  {
    name: "Cursor / Codex",
    body: "Rapid full-stack development for the hackathon MVP.",
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="grid min-h-[76vh] items-center gap-10 py-8 lg:grid-cols-[1fr_26rem]">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent">
            24-hour hackathon MVP · AI GTM for HVAC contractors
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
            ReadyLead helps contractors find building maintenance leads before property managers request bids.
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-8 text-muted">
            ReadyLead is an AI GTM platform for contractors. It analyzes
            building age, HVAC permit history, resident complaints, HOA notes,
            SF 311 no-heat complaints, weather stress, plan-extracted systems,
            and contact paths to surface likely HVAC maintenance opportunities
            before competitors are bidding.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition hover:bg-orange-600"
            >
              Open Demo Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-card-border px-6 py-3 font-medium text-muted transition hover:border-accent hover:text-foreground"
            >
              View Demo Flow
            </a>
          </div>
        </div>

        <Card className="bg-card/70">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Target className="h-6 w-6" />
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Demo moment</p>
          <p className="mt-3 text-2xl font-semibold leading-8">
            Add one HOA signal and watch Mission Creek become a Hot opportunity.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-card-border bg-background/60 p-4">
              <p className="text-sm text-muted">Before</p>
              <p className="mt-1 text-4xl font-semibold">72</p>
            </div>
            <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
              <p className="text-sm text-accent">After</p>
              <p className="mt-1 text-4xl font-semibold">92</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Problem
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Contractors buy expensive reactive leads after something breaks.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            By then, every competitor is bidding.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {painCards.map((card) => (
            <Card key={card.title}>
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{card.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Solution
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            From building signals to contractor outreach.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            ReadyLead turns public maintenance signals, building risk
            indicators, contact paths, and contractor matching into ranked,
            evidence-backed sales opportunities.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {agents.map((agent) => {
            const Icon = agent.icon;

            return (
              <Card key={agent.title}>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{agent.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{agent.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Architecture
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            A simple agent pipeline built for a live demo.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-7">
          {architecture.map((step, index) => (
            <div key={step} className="relative">
              <div className="rounded-2xl border border-card-border bg-card/90 p-4 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background text-accent">
                  {index === 0 ? (
                    <FileText className="h-5 w-5" />
                  ) : index === 1 ? (
                    <Database className="h-5 w-5" />
                  ) : index === 6 ? (
                    <Building2 className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </div>
                <p className="text-sm font-medium">{step}</p>
              </div>
              {index < architecture.length - 1 ? (
                <div className="hidden md:block absolute -right-2 top-1/2 h-px w-4 bg-card-border" />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="py-14">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Live demo flow
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Show the GTM workflow in under a minute.
            </h2>
          </div>
          <Card>
            <ol className="space-y-4">
              {demoSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-muted">{step}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      <section className="py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Sponsor / tech stack
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Practical sponsor usage, without overclaiming.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.name}>
              <h3 className="text-lg font-semibold">{sponsor.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{sponsor.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-14">
        <Card className="border-accent/30 bg-accent/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
                Hackathon scope
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                Hackathon MVP: uses fake but realistic building, signal, contact
                path, and contractor data. The product performs signal-based
                opportunity scoring, not guaranteed failure prediction.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-600"
            >
              Open Demo Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
