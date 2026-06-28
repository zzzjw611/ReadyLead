// Call records for the Calls status page. Seeded with sample completed calls;
// new calls placed from the map are persisted to localStorage (client-only).
// When real Vapi is wired, these come from the call webhook instead.

export type CallStatus = "in_progress" | "completed" | "no_answer";
export type CallOutcome = "booked" | "callback" | "not_interested" | "pending";

export type Turn = { speaker: "agent" | "owner"; text: string };

export type CallRecord = {
  id: string;
  address: string;
  segment: string;
  score: number;
  startedAt: string; // ISO-ish or display string
  status: CallStatus;
  outcome: CallOutcome;
  bookedFor?: string;
  summary: string;
  transcript: Turn[];
};

export const seedCalls: CallRecord[] = [
  {
    id: "seed_480ellis",
    address: "480 ELLIS ST",
    segment: "commercial-repair",
    score: 88,
    startedAt: "Today, 9:42 AM",
    status: "completed",
    outcome: "booked",
    bookedFor: "Thu 2:00 PM",
    summary: "Owner confirmed chronic heating issues. Booked a free inspection Thursday 2pm.",
    transcript: [
      { speaker: "agent", text: "Hi, this is Alex with Summit Mechanical — I'm calling about 480 Ellis St; it had several no-heat reports on an ~18-year-old system. Do you have a sec?" },
      { speaker: "owner", text: "Yeah, the heat's been flaky for months honestly." },
      { speaker: "agent", text: "We can do a free 30-minute inspection. Thursday at 2pm or Friday morning?" },
      { speaker: "owner", text: "Thursday works." },
      { speaker: "agent", text: "Locked in Thursday 2pm. Confirmation coming by email — thanks!" },
    ],
  },
  {
    id: "seed_888ofarrell",
    address: "888 OFARRELL ST",
    segment: "commercial-repair",
    score: 73,
    startedAt: "Today, 9:15 AM",
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

const KEY = "readylead_calls";

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

export function saveCall(c: CallRecord) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const mine: CallRecord[] = raw ? JSON.parse(raw) : [];
    window.localStorage.setItem(KEY, JSON.stringify([c, ...mine.filter((x) => x.id !== c.id)]));
  } catch {
    /* ignore */
  }
}
