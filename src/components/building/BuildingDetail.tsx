"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ConvexProvider,
  ConvexReactClient,
  useAction,
  useMutation,
  useQuery,
} from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Route,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/Card";

type Opportunity = {
  riskScore?: number;
  predictedNeed?: string;
  trade?: string;
  urgencyWindow?: string;
  reason?: string;
  evidence?: string[];
  bestContactPath?: ContactPathSnapshot;
  matchedContractors?: MatchedContractor[];
  outreachDraft?: {
    subject?: string;
    body?: string;
  };
};

type BuildingDoc = {
  _id: Id<"buildings">;
  externalId: string;
  name: string;
  address: string;
  city: string;
  buildingType: string;
  yearBuilt: number;
  units: number;
  propertyManager: string;
  managerEmail: string;
  systems: string[];
  lastMajorHVACPermitYear?: number;
  lastPlumbingPermitYear?: number;
};

type SignalDoc = {
  _id: string;
  type: string;
  date: string;
  text: string;
  source: string;
  createdAt?: number;
};

type ContactPathDoc = {
  _id: string;
  sourceType: string;
  targetType: string;
  company: string;
  personName?: string;
  role: string;
  phone?: string;
  email?: string;
  url?: string;
  linkedinSearchUrl?: string;
  confidence: number;
  evidence: string;
  isBestPath?: boolean;
};

type ContactPathSnapshot = Omit<ContactPathDoc, "_id" | "isBestPath">;

type MatchedContractor = {
  company: string;
  fitScore: number;
  reason: string;
  email: string;
  phone: string;
  specialties: string[];
};

type BuildingDetailResult = {
  building: BuildingDoc;
  signals: SignalDoc[];
  contactPaths: ContactPathDoc[];
  bestContactPath?: ContactPathDoc | null;
  opportunity?: Opportunity | null;
} | null;

function getRiskLabel(score: number): "Hot" | "High" | "Medium" | "Low" {
  if (score >= 85) return "Hot";
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function getRiskBadgeClass(score: number) {
  if (score >= 85) return "border-red-500/40 bg-red-500/15 text-red-300";
  if (score >= 70) return "border-orange-500/40 bg-orange-500/15 text-orange-300";
  if (score >= 50) return "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
  return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
}

function getSignalBadgeClass(type: string) {
  const classes: Record<string, string> = {
    resident_review: "border-sky-500/40 bg-sky-500/15 text-sky-300",
    permit_history: "border-violet-500/40 bg-violet-500/15 text-violet-300",
    hoa_minutes: "border-orange-500/40 bg-orange-500/15 text-orange-300",
    weather: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
    inspection: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    plan_extraction: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  };

  return classes[type] ?? "border-card-border bg-background text-muted";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6">{value ?? "Not available"}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <Card className="flex min-h-72 items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
        <p className="mt-4 text-sm text-muted">Loading building opportunity...</p>
      </div>
    </Card>
  );
}

function NotFoundState() {
  return (
    <Card>
      <h1 className="text-2xl font-semibold">Building not found</h1>
      <p className="mt-2 text-sm text-muted">
        This opportunity may not exist yet, or demo data may need to be seeded.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-full border border-accent/50 px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white"
      >
        Back to dashboard
      </Link>
    </Card>
  );
}

function ContactPathCard({
  contactPath,
  title,
}: {
  contactPath?: ContactPathDoc | ContactPathSnapshot | null;
  title: string;
}) {
  if (!contactPath) {
    return (
      <Card>
        <SectionHeader icon={Route} title={title} />
        <p className="text-sm text-muted">No contact path available yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader
        icon={Route}
        title={title}
        subtitle="Demo contact path intelligence, not verified contact data."
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{contactPath.company}</h3>
          {contactPath.personName ? (
            <p className="mt-1 text-sm text-muted">
              {contactPath.personName} · {contactPath.role}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">{contactPath.role}</p>
          )}
        </div>
        <span
          className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${
            contactPath.confidence < 65
              ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-300"
              : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          }`}
        >
          {contactPath.confidence}% confidence
        </span>
      </div>

      {contactPath.confidence < 65 ? (
        <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          Needs human verification before sending.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <DetailField label="Source" value={formatLabel(contactPath.sourceType)} />
        <DetailField label="Target" value={formatLabel(contactPath.targetType)} />
        <DetailField label="Email" value={contactPath.email} />
        <DetailField label="Phone" value={contactPath.phone} />
      </div>

      <p className="mt-5 text-sm leading-6 text-muted">{contactPath.evidence}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        {contactPath.url ? (
          <a
            href={contactPath.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Open Contact Page
          </a>
        ) : null}
        {contactPath.linkedinSearchUrl ? (
          <a
            href={contactPath.linkedinSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground"
          >
            <UserRound className="h-4 w-4" />
            Search LinkedIn
          </a>
        ) : null}
      </div>
    </Card>
  );
}

function BuildingDetailContent({ buildingId }: { buildingId: Id<"buildings"> }) {
  const detail = useQuery(api.buildings.getBuildingDetail, {
    buildingId,
  }) as BuildingDetailResult | undefined;
  const addSignalToBuilding = useMutation(api.buildings.addSignalToBuilding);
  const analyzeAndSaveOpportunity = useAction(api.analyze.analyzeAndSaveOpportunity);
  const [isAddingSignal, setIsAddingSignal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sortedSignals = useMemo(
    () =>
      [...(detail?.signals ?? [])].sort((a, b) => {
        const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
        return byDate === 0 ? (b.createdAt ?? 0) - (a.createdAt ?? 0) : byDate;
      }),
    [detail?.signals],
  );
  const sortedContactPaths = useMemo(
    () => [...(detail?.contactPaths ?? [])].sort((a, b) => b.confidence - a.confidence),
    [detail?.contactPaths],
  );

  if (detail === undefined) {
    return <LoadingState />;
  }

  if (detail === null) {
    return <NotFoundState />;
  }

  const { building, opportunity } = detail;
  const isSF311Building = building.externalId.startsWith("sf311_");
  const riskScore = opportunity?.riskScore ?? 0;
  const riskLabel = getRiskLabel(riskScore);
  const bestContactPath = detail.bestContactPath ?? opportunity?.bestContactPath ?? null;
  const outreachSubject = opportunity?.outreachDraft?.subject;
  const outreachBody = opportunity?.outreachDraft?.body;

  async function reanalyze() {
    setIsAnalyzing(true);
    setError(null);
    setStatusMessage(null);

    try {
      const result = (await analyzeAndSaveOpportunity({ buildingId })) as {
        success?: boolean;
        error?: string;
      };

      if (result.success === false) {
        throw new Error(result.error ?? "Re-analysis failed.");
      }

      setStatusMessage("Opportunity analysis updated.");
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Re-analysis failed.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function addHoaSignal() {
    setIsAddingSignal(true);
    setError(null);
    setStatusMessage(null);

    try {
      await addSignalToBuilding({
        buildingId,
        type: "hoa_minutes",
        source: "Injected Demo Signal",
        text: "HOA minutes: Board received 12 cooling complaints during the June heat wave and asked management to collect HVAC vendor options before the next meeting.",
      });

      const result = (await analyzeAndSaveOpportunity({ buildingId })) as {
        success?: boolean;
        error?: string;
      };

      if (result.success === false) {
        throw new Error(result.error ?? "Signal added, but re-analysis failed.");
      }

      setStatusMessage("New HOA signal added and opportunity re-analyzed.");
    } catch (signalError) {
      setError(signalError instanceof Error ? signalError.message : "Add signal failed.");
    } finally {
      setIsAddingSignal(false);
    }
  }

  async function copyDraft() {
    if (!outreachSubject && !outreachBody) return;

    await navigator.clipboard.writeText(`Subject: ${outreachSubject ?? ""}\n\n${outreachBody ?? ""}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                  Opportunity Ready
                </span>
                {isSF311Building ? (
                  <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-300">
                    Source: SF 311 No-Heat Complaint
                  </span>
                ) : null}
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskBadgeClass(
                    riskScore,
                  )}`}
                >
                  {opportunity ? riskLabel : "Needs Analysis"}
                </span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">{building.name}</h1>
              <p className="mt-3 text-muted">{building.city}</p>
              <p className="mt-5 max-w-3xl text-lg leading-8">
                {opportunity?.predictedNeed ?? "Needs Analysis"}
              </p>
              <p className="mt-2 text-sm text-muted">
                Urgency: {opportunity?.urgencyWindow ?? "Run analysis to estimate timing"}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-muted">Risk score</p>
              <p className="text-6xl font-semibold tracking-tight">{riskScore}</p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader
            icon={Sparkles}
            title="Demo Controls"
            subtitle="Inject signal, then re-run deterministic agents."
          />
          <div className="space-y-3">
            <button
              type="button"
              onClick={addHoaSignal}
              disabled={isAddingSignal || isAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAddingSignal ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              Add New HOA Signal
            </button>
            <button
              type="button"
              onClick={reanalyze}
              disabled={isAddingSignal || isAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-card-border px-4 py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Re-analyze Opportunity
            </button>
          </div>
          {statusMessage ? (
            <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {statusMessage}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader icon={Building2} title="Building Profile" />
          <div className="grid gap-5 md:grid-cols-2">
            <DetailField label="Address" value={building.address} />
            <DetailField label="Building type" value={building.buildingType} />
            <DetailField label="Year built" value={building.yearBuilt} />
            <DetailField label="Units" value={building.units} />
            <DetailField label="Property manager" value={building.propertyManager} />
            <DetailField label="Manager email" value={building.managerEmail} />
            <DetailField label="Last major HVAC permit" value={building.lastMajorHVACPermitYear} />
            <DetailField label="Last major plumbing permit" value={building.lastPlumbingPermitYear} />
          </div>
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Systems</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {building.systems.map((system) => (
                <span
                  key={system}
                  className="rounded-full border border-card-border bg-background px-3 py-1 text-sm text-muted"
                >
                  {system}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader
            icon={AlertTriangle}
            title="Signal Timeline"
            subtitle="Signals explained from demo sources."
          />
          <div className="space-y-3">
            {sortedSignals.map((signal) => (
              <div
                key={signal._id}
                className={`rounded-xl border bg-background/60 p-4 ${
                  signal.source === "DataSF 311 No-Heat Complaint"
                    ? "border-cyan-500/40"
                    : "border-card-border"
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getSignalBadgeClass(
                      signal.type,
                    )}`}
                  >
                    {formatLabel(signal.type)}
                  </span>
                  <span className="text-xs text-muted">{signal.date}</span>
                  {signal.source === "DataSF 311 No-Heat Complaint" ? (
                    <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 text-xs font-medium text-cyan-300">
                      DataSF 311
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-6">{signal.text}</p>
                <p className="mt-2 text-xs text-muted">Source: {signal.source}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <SectionHeader
            icon={Sparkles}
            title="Signal-based opportunity analysis"
            subtitle="Careful, GTM-oriented analysis based on building and signal data."
          />
          {opportunity ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <DetailField label="Risk score" value={opportunity.riskScore} />
                <DetailField label="Trade" value={opportunity.trade} />
                <DetailField label="Urgency" value={opportunity.urgencyWindow} />
                <DetailField label="Risk label" value={riskLabel} />
              </div>
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Predicted need</p>
                <p className="mt-2 text-sm leading-6">{opportunity.predictedNeed}</p>
              </div>
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Reason</p>
                <p className="mt-2 text-sm leading-6 text-muted">{opportunity.reason}</p>
              </div>
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Evidence</p>
                {opportunity.evidence?.length ? (
                  <ul className="mt-3 space-y-2">
                    {opportunity.evidence.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-muted">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">No evidence available yet.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Run analysis to generate risk analysis.</p>
          )}
        </Card>

        <ContactPathCard contactPath={bestContactPath} title="Contact Path Agent" />
      </div>

      <Card className="mt-6">
        <SectionHeader
          icon={Route}
          title="Ranked Contact Paths"
          subtitle="Operational routes are preferred over legal ownership records."
        />
        <div className="grid gap-3">
          {sortedContactPaths.map((contactPath) => (
            <div key={contactPath._id} className="rounded-xl border border-card-border bg-background/60 p-4">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-start">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Source</p>
                  <p className="mt-2 text-sm">{formatLabel(contactPath.sourceType)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Target</p>
                  <p className="mt-2 text-sm">{formatLabel(contactPath.targetType)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Contact</p>
                  <p className="mt-2 text-sm">
                    {contactPath.personName ?? contactPath.company} · {contactPath.role}
                  </p>
                </div>
                <span className="rounded-full border border-card-border px-3 py-1 text-sm text-muted">
                  {contactPath.confidence}%
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{contactPath.evidence}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {contactPath.url ? (
                  <a href={contactPath.url} target="_blank" rel="noreferrer" className="text-sm text-accent">
                    Open Contact Page
                  </a>
                ) : null}
                {contactPath.linkedinSearchUrl ? (
                  <a href={contactPath.linkedinSearchUrl} target="_blank" rel="noreferrer" className="text-sm text-accent">
                    Search LinkedIn
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader icon={Wrench} title="Matched Contractors" />
          {opportunity?.matchedContractors?.length ? (
            <div className="space-y-3">
              {opportunity.matchedContractors.slice(0, 3).map((contractor) => (
                <div key={contractor.company} className="rounded-xl border border-card-border bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{contractor.company}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{contractor.reason}</p>
                    </div>
                    <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm text-accent">
                      {contractor.fitScore}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {contractor.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {contractor.phone}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contractor.specialties.map((specialty) => (
                      <span key={specialty} className="rounded-full bg-card px-3 py-1 text-xs text-muted">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No contractor matches available yet.</p>
          )}
        </Card>

        <Card>
          <SectionHeader icon={Mail} title="Outreach Draft" />
          {outreachSubject || outreachBody ? (
            <>
              <div className="rounded-xl border border-card-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Target contact</p>
                <p className="mt-2 text-sm">
                  {bestContactPath?.personName ?? bestContactPath?.company ?? "Contact path"} ·{" "}
                  {bestContactPath?.role ?? "Role unknown"}
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-card-border bg-background/60 p-4">
                <p className="text-sm font-medium">Subject: {outreachSubject}</p>
                <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-muted">
                  {outreachBody}
                </pre>
              </div>
              <button
                type="button"
                onClick={copyDraft}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground"
              >
                <Clipboard className="h-4 w-4" />
                {copied ? "Copied" : "Copy Draft"}
              </button>
            </>
          ) : (
            <p className="text-sm text-muted">Run analysis to generate outreach.</p>
          )}
        </Card>
      </div>
    </>
  );
}

export function BuildingDetail({ buildingId }: { buildingId: string }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convex = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [convexUrl],
  );

  if (!convex) {
    return (
      <Card>
        <h1 className="text-2xl font-semibold">Convex is not configured</h1>
        <p className="mt-2 text-sm text-muted">
          Set `NEXT_PUBLIC_CONVEX_URL` after creating a Convex deployment, then reload this page.
        </p>
      </Card>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <BuildingDetailContent buildingId={buildingId as Id<"buildings">} />
    </ConvexProvider>
  );
}
