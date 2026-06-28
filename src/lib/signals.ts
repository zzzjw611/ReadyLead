// Three opportunity categories (the lanes) — these drive the map dot colors.
export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  "311": { label: "311 · active problem", color: "#ef4444" },     // red
  replacement: { label: "Replacement candidate", color: "#f59e0b" }, // amber
  "commercial-project": { label: "Commercial project", color: "#2563eb" }, // blue
};
export const CATEGORY_ORDER = ["311", "replacement", "commercial-project"];

export function category(segment?: string): string {
  if (segment === "commercial-project") return "commercial-project";
  if (segment === "replacement-candidate") return "replacement";
  return "311"; // commercial-repair / residential-repair = a 311 active problem
}
export function categoryColor(segment?: string): string {
  return CATEGORY_META[category(segment)]?.color || "#94a3b8";
}
export function categoryLabel(segment?: string): string {
  return CATEGORY_META[category(segment)]?.label || "Opportunity";
}

// 311 problem sub-types (HVAC only) — a second filter, only meaningful for the 311 category.
export const SIGNAL_META: Record<string, { label: string }> = {
  no_heat: { label: "No heat" },
  no_hot_water: { label: "No hot water" },
  mold: { label: "Mold / moisture" },
  ventilation: { label: "Ventilation" },
};
export const SIGNAL_ORDER = ["no_heat", "no_hot_water", "mold", "ventilation"];

export function primarySignal(signals?: string): string {
  return (signals || "").split(",")[0].trim();
}
export function signalLabel(key: string): string {
  return SIGNAL_META[key]?.label || key.replace(/_/g, " ");
}
