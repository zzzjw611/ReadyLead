// Rough HVAC deal-value estimate per opportunity (for the value filter + display).
// Heuristic by segment + score + system age — not a quote, just a ranking signal.

export function estimateValue(o: { segment?: string; score?: number; systemAge?: string | number }): number {
  const score = Number(o.score) || 0;
  const age = Number(o.systemAge) || 0;
  let v: number;
  switch (o.segment) {
    case "commercial-project": v = 120000 + score * 1600; break;
    case "commercial-repair": v = 9000 + age * 700 + score * 120; break;
    case "replacement-candidate": v = 8000 + age * 650 + score * 70; break;
    case "residential-repair": v = 2500 + score * 55; break;
    default: v = 4000 + score * 90;
  }
  return Math.round(v / 500) * 500;
}

export function fmtValue(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${v}`;
}

export type ValueBand = "lt10" | "10to50" | "gt50";
export const VALUE_BANDS: { key: ValueBand; label: string }[] = [
  { key: "lt10", label: "< $10k" },
  { key: "10to50", label: "$10k – $50k" },
  { key: "gt50", label: "$50k +" },
];
export function inBand(v: number, b: string): boolean {
  if (b === "lt10") return v < 10000;
  if (b === "10to50") return v >= 10000 && v < 50000;
  if (b === "gt50") return v >= 50000;
  return true;
}
