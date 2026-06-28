// Call records for the Calls page (Signalsurf-style timeline).
// New calls start in "dialing" and animate to completed; persisted to localStorage.
// When real Vapi is wired, status/transcript come from the Vapi webhook instead.

import { simulatedTranscript, company, BOOKING_SLOTS, type Opp } from "./voiceAgent";

export type CallStatus = "dialing" | "in_progress" | "completed" | "no_answer";
export type CallOutcome = "booked" | "callback" | "not_interested" | "pending";
export type Turn = { speaker: "agent" | "owner"; text: string };

export type CallRecord = {
  id: string;
  address: string;
  segment: string;
  score: number;
  signals: string;
  systemAge: string;
  why: string;
  phone: string;
  startedAt: string;
  durationSec: number;
  status: CallStatus;
  outcome: CallOutcome;
  bookedFor?: string;
  summary: string;
  transcript: Turn[];
};

// demo dial target — replaced by the real owner number once Vapi + enrichment are live
const DEMO_PHONE = "+1 (415) 555-0142";

export function makeCall(o: Opp & { score?: number; segment?: string }): CallRecord {
  return {
    id: `call_${(o.address || "x").replace(/\s+/g, "_")}_${Date.now()}`,
    address: o.address,
    segment: o.segment || "opportunity",
    score: o.score ?? 0,
    signals: o.signals || "",
    systemAge: o.systemAge || "",
    why: o.why || "",
    phone: DEMO_PHONE,
    startedAt: "Just now",
    durationSec: 0,
    status: "dialing",
    outcome: "pending",
    summary: "Dialing the decision-maker…",
    transcript: [],
  };
}

// the full scripted transcript the dialing animation reveals
export function scriptFor(o: Opp): Turn[] {
  return simulatedTranscript(o);
}

export const BOOKED_SLOT = BOOKING_SLOTS[0];
export const AGENT_NAME = company.name;

export const seedCalls: CallRecord[] = [
  {
    id: "seed_888ofarrell",
    address: "888 OFARRELL ST",
    segment: "commercial-repair",
    score: 73,
    signals: "no_heat",
    systemAge: "",
    why: "Commercial repair lead: 888 Ofarrell St has an OPEN 311 habitability complaint (landlord legally on the hook today).",
    phone: "+1 (415) 519-6210",
    startedAt: "Today, 9:15 AM",
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

const KEY = "readylead_calls_v2";

export function loadCalls(): CallRecord[] {
  if (typeof window === "undefined") return seedCalls;
  try {
    const raw = window.localStorage.getItem(KEY);
    const mine: CallRecord[] = raw ? JSON.parse(raw) : [];
    return [...mine, ...seedCalls];
  } catch {
    return seedCalls;
  }
}

export function persistCalls(mine: CallRecord[]) {
  if (typeof window === "undefined") return;
  try {
    // store only non-seed calls
    const seedIds = new Set(seedCalls.map((s) => s.id));
    window.localStorage.setItem(KEY, JSON.stringify(mine.filter((c) => !seedIds.has(c.id))));
  } catch {
    /* ignore */
  }
}
