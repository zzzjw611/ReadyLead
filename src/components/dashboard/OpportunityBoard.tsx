"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Building2,
  Database,
  Flame,
  Loader2,
  Radio,
  Route,
  Sparkles,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/Card";
import { ConvexClientBoundary } from "@/components/ConvexClientBoundary";

type RiskLabel = "Hot" | "High" | "Medium" | "Low";

type DashboardOpportunity = {
  riskScore?: number;
  predictedNeed?: string;
  urgencyWindow?: string;
  evidence?: string[];
  bestContactPath?: {
    confidence?: number;
  };
};

type DashboardBuilding = {
  id: string;
  externalId: string;
  name: string;
  city: string;
  buildingType: string;
  units: number;
  yearBuilt: number;
  systems: string[];
  opportunity?: DashboardOpportunity | null;
  bestContactPathConfidence?: number | null;
};

function getRiskLabel(score: number): RiskLabel {
  if (score >= 85) return "Hot";
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function getRiskBadgeClass(score: number) {
  if (score >= 85) {
    return "border-red-500/40 bg-red-500/15 text-red-300";
  }

  if (score >= 70) {
    return "border-orange-500/40 bg-orange-500/15 text-orange-300";
  }

  if (score >= 50) {
    return "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
  }

  return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
}

function averageRiskScore(buildings: DashboardBuilding[]) {
  if (buildings.length === 0) return 0;

  const total = buildings.reduce(
    (sum, building) => sum + (building.opportunity?.riskScore ?? 0),
    0,
  );

  return Math.round(total / buildings.length);
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="bg-card/80">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card className="flex min-h-64 items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
        <p className="mt-4 text-sm text-muted">Loading opportunity board...</p>
      </div>
    </Card>
  );
}

function EmptyState() {
  const seedAll = useMutation(api.seed.seedAll);
  const importSF311DemoData = useMutation(api.sf311.importSF311DemoData);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setIsSeeding(true);
    setError(null);

    try {
      await seedAll();
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "Failed to seed demo data.");
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleSF311Import() {
    setIsImporting(true);
    setError(null);

    try {
      await importSF311DemoData();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Failed to import SF 311 signals.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Card className="flex min-h-72 items-center justify-center border-dashed">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-semibold">No demo data yet</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Seed realistic Bay Area buildings, contact paths, contractors, and initial
          HVAC opportunities for the live demo.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleSeed}
            disabled={isSeeding || isImporting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSeeding ? "Seeding..." : "Seed Demo Data"}
          </button>
          <button
            type="button"
            onClick={handleSF311Import}
            disabled={isSeeding || isImporting}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-card-border px-5 py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            {isImporting ? "Importing SF 311 signals..." : "Import SF 311 No-Heat Signals"}
          </button>
        </div>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </div>
    </Card>
  );
}

function SF311ImportButton() {
  const importSF311DemoData = useMutation(api.sf311.importSF311DemoData);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleImport() {
    setIsImporting(true);
    setMessage(null);

    try {
      await importSF311DemoData();
      setMessage("SF 311 signals imported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "SF 311 import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <button
        type="button"
        onClick={handleImport}
        disabled={isImporting}
        className="inline-flex items-center gap-2 rounded-full border border-card-border px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
        {isImporting ? "Importing SF 311 signals..." : "Import SF 311 No-Heat Signals"}
      </button>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}

function OpportunityCard({ building }: { building: DashboardBuilding }) {
  const riskScore = building.opportunity?.riskScore ?? 0;
  const riskLabel = getRiskLabel(riskScore);
  const evidence = building.opportunity?.evidence?.slice(0, 2) ?? [];
  const confidence =
    building.bestContactPathConfidence ??
    building.opportunity?.bestContactPath?.confidence ??
    null;

  return (
    <Card className="transition hover:border-accent/60 hover:bg-card">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{building.name}</h2>
            {building.externalId.startsWith("sf311_") ? (
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-300">
                Source: SF 311
              </span>
            ) : null}
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskBadgeClass(
                riskScore,
              )}`}
            >
              {riskLabel}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {building.city} · {building.buildingType} · {building.units} units · Built{" "}
            {building.yearBuilt}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Predicted need</p>
              <p className="mt-2 text-sm leading-6">
                {building.opportunity?.predictedNeed ?? "Needs analysis"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Urgency window</p>
              <p className="mt-2 text-sm leading-6">
                {building.opportunity?.urgencyWindow ?? "Needs analysis"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Contact confidence</p>
              <p className="mt-2 text-sm leading-6">
                {typeof confidence === "number" ? `${confidence}%` : "Not available"}
              </p>
            </div>
          </div>

          <p className="mt-5 line-clamp-2 text-sm leading-6 text-muted">
            {evidence.length > 0
              ? evidence.join(" ")
              : "Evidence will appear after this building is analyzed."}
          </p>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-4 lg:flex-col lg:items-end">
          <div className="text-right">
            <p className="text-sm text-muted">Risk score</p>
            <p className="text-5xl font-semibold tracking-tight text-foreground">{riskScore}</p>
          </div>
          <Link
            href={`/building/${building.id}`}
            className="rounded-full border border-accent/50 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-white"
          >
            View Opportunity
          </Link>
        </div>
      </div>
    </Card>
  );
}

function OpportunityBoardContent() {
  const buildings = useQuery(
    api.buildings.listBuildingsWithOpportunities,
  ) as DashboardBuilding[] | undefined;

  const sortedBuildings = useMemo(
    () =>
      [...(buildings ?? [])].sort(
        (a, b) => (b.opportunity?.riskScore ?? 0) - (a.opportunity?.riskScore ?? 0),
      ),
    [buildings],
  );

  if (buildings === undefined) {
    return <LoadingState />;
  }

  if (buildings.length === 0) {
    return <EmptyState />;
  }

  const highRiskCount = sortedBuildings.filter(
    (building) => (building.opportunity?.riskScore ?? 0) >= 70,
  ).length;
  const hotCount = sortedBuildings.filter(
    (building) => (building.opportunity?.riskScore ?? 0) >= 85,
  ).length;
  const contactPathsFound = sortedBuildings.filter(
    (building) =>
      typeof building.bestContactPathConfidence === "number" ||
      typeof building.opportunity?.bestContactPath?.confidence === "number",
  ).length;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">
            Live sources: seeded building data plus optional SF 311 no-heat import.
          </p>
        </div>
        <SF311ImportButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={Building2}
          label="Total buildings indexed"
          value={sortedBuildings.length}
        />
        <MetricCard icon={AlertTriangle} label="High-risk opportunities" value={highRiskCount} />
        <MetricCard icon={Flame} label="Hot opportunities" value={hotCount} />
        <MetricCard
          icon={Radio}
          label="Average risk score"
          value={averageRiskScore(sortedBuildings)}
        />
        <MetricCard icon={Route} label="Contact paths found" value={contactPathsFound} />
      </div>

      <div className="mt-8 space-y-4">
        {sortedBuildings.map((building) => (
          <OpportunityCard key={building.id} building={building} />
        ))}
      </div>
    </>
  );
}

export function OpportunityBoard() {
  return (
    <ConvexClientBoundary>
      <OpportunityBoardContent />
    </ConvexClientBoundary>
  );
}
