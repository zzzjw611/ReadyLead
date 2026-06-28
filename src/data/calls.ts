// Outreach records for the Outreach (/calls) page.
// Leads are ADDED from the map (status "queued"), then you Call or Email each.
// Real calls go through /api/vapi-call (Vapi); transcript comes back via polling.

import { simulatedTranscript, company, BOOKING_SLOTS, type Opp } from "./voiceAgent";
import { estimateValue } from "@/lib/estimate";

export type CallStatus = "queued" | "dialing" | "in_progress" | "completed" | "no_answer";
export type CallOutcome = "pending" | "booked" | "callback" | "not_interested" | "emailed";
export type Turn = { speaker: "agent" | "owner"; text: string };

export type Lead = {
  id: string;
  address: string;
  segment: string;
  score: number;
  signals: string;
  systemAge: string;
  why: string;
  estValue: number;
  phone: string;
  confidence?: string;
  addedAt: string;
  durationSec: number;
  status: CallStatus;
  outcome: CallOutcome;
  bookedFor?: string;
  email?: string;
  summary: string;
  transcript: Turn[];
  vapiId?: string;
};

type OppIn = Opp & { score?: number; segment?: string; phone?: string; email?: string; confidence?: string };

function base(o: OppIn) {
  return {
    id: `lead_${(o.address || "x").replace(/\s+/g, "_")}_${Date.now()}`,
    address: o.address,
    segment: o.segment || "opportunity",
    score: o.score ?? 0,
    signals: o.signals || "",
    systemAge: o.systemAge || "",
    why: o.why || "",
    estValue: estimateValue({ segment: o.segment, score: o.score, systemAge: o.systemAge }),
    phone: o.phone || "", // real enriched owner number when present; the live call dials the demo line separately
    email: o.email || undefined, // real enriched email when present; otherwise captured on the call
    confidence: o.confidence || "",
    addedAt: "Just now",
    durationSec: 0,
    bookedFor: undefined as string | undefined,
    transcript: [] as Turn[],
  };
}

export function makeQueued(o: OppIn): Lead {
  return { ...base(o), status: "queued", outcome: "pending", summary: "Added to outreach." };
}
export function makeDialing(o: OppIn): Lead {
  return { ...base(o), status: "dialing", outcome: "pending", summary: "Dialing…" };
}

export function scriptFor(o: Opp): Turn[] {
  return simulatedTranscript(o);
}

export function emailDraft(o: { address: string; signals?: string; why?: string }) {
  const subject = `Quick HVAC check for ${o.address}`;
  const body =
    `Hi,\n\nThis is Alex at ${company.name} — we do commercial HVAC in San Francisco. ` +
    `We flagged ${o.address} from public maintenance signals${o.why ? ` (${o.why.toLowerCase()})` : ""}. ` +
    `We offer a free 30-minute on-site inspection and can usually get a tech out same-week.\n\n` +
    `Would Thursday or Friday work for a quick look?\n\nBest,\nAlex\n${company.name} · ${company.phone}`;
  return { subject, body };
}

export const BOOKED_SLOT = BOOKING_SLOTS[0];
export const AGENT_NAME = company.name;

export const seedLeads: Lead[] = [
  {
    id: "seed_888ofarrell",
    address: "888 OFARRELL ST",
    segment: "commercial-repair",
    score: 73,
    signals: "no_heat",
    systemAge: "16",
    why: "Commercial repair lead: 888 Ofarrell St has an OPEN 311 habitability complaint (landlord legally on the hook today).",
    estValue: estimateValue({ segment: "commercial-repair", score: 73, systemAge: "16" }),
    phone: "", // real number comes from the enriched contacts overlay (NEXT_PUBLIC_CONTACTS_JSON)
    confidence: "HIGH (validated email)",
    addedAt: "Today, 9:15 AM",
    durationSec: 64,
    status: "completed",
    outcome: "callback",
    summary: "Reached front desk; property manager out. Calling back tomorrow AM.",
    transcript: [
      { speaker: "agent", text: "Hi, calling about an open no-heat complaint at 888 Ofarrell — is the property manager available?" },
      { speaker: "owner", text: "She's out today, try tomorrow morning." },
      { speaker: "agent", text: "Will do, thanks — I'll follow up tomorrow AM." },
    ],
  },
];

const KEY = "readylead_leads_v4"; // v4: leads no longer bake in the demo phone (real number shown instead)

export function loadLeads(): Lead[] {
  if (typeof window === "undefined") return seedLeads;
  try {
    const raw = window.localStorage.getItem(KEY);
    const mine: Lead[] = raw ? JSON.parse(raw) : [];
    return [...mine, ...seedLeads];
  } catch {
    return seedLeads;
  }
}

export function persistLeads(all: Lead[]) {
  if (typeof window === "undefined") return;
  try {
    const seedIds = new Set(seedLeads.map((s) => s.id));
    window.localStorage.setItem(KEY, JSON.stringify(all.filter((c) => !seedIds.has(c.id))));
  } catch { /* ignore */ }
}

// add a lead from the map; returns false if already queued
export function queueLead(o: OppIn): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(KEY);
    const mine: Lead[] = raw ? JSON.parse(raw) : [];
    if (mine.some((l) => l.address === o.address)) return false;
    window.localStorage.setItem(KEY, JSON.stringify([makeQueued(o), ...mine]));
    return true;
  } catch { return false; }
}

export function queuedCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Lead[]).length : 0;
  } catch { return 0; }
}
