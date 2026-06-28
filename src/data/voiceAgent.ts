// Voice agent identity + script for the outbound HVAC contractor.
// Edit `company` to rebrand. The script references each building's live signal.

export const company = {
  name: "Summit Mechanical",
  tagline: "Licensed commercial & residential HVAC — San Francisco",
  rep: "Alex",
  phone: "(415) 555-0142",
  services: [
    "Heating repair & replacement",
    "Rooftop / AC service",
    "Boiler & mechanical retrofits",
    "Preventive maintenance plans",
  ],
};

export type Opp = {
  address: string;
  segment?: string;
  signals?: string;
  systemAge?: string;
  why?: string;
};

function signalPhrase(o: Opp): string {
  const sig = (o.signals || "").split(",")[0];
  const map: Record<string, string> = {
    no_heat: "a recent no-heat report",
    no_hot_water: "a no-hot-water report",
    mold: "a moisture/ventilation complaint",
    ventilation: "a ventilation complaint",
    plumbing: "a recent plumbing/mechanical complaint",
    electrical: "a recent electrical complaint",
  };
  const base = map[sig] || "a recent building-system complaint";
  if (o.systemAge && Number(o.systemAge) >= 15) {
    return `${base} on a system that's about ${o.systemAge} years old`;
  }
  return base;
}

// The system prompt you'd hand to Vapi (or any voice model).
export function systemPrompt(o: Opp): string {
  return [
    `You are ${company.rep}, an outbound rep for ${company.name}, a licensed HVAC contractor in San Francisco.`,
    `You're calling the owner or property manager of ${o.address}.`,
    `Reason for the call: the building has ${signalPhrase(o)}.`,
    `Goal: book a free 30-minute on-site inspection. Be brief, warm, and professional — never pushy.`,
    `Offer two time options. If they agree, confirm the time and say a written confirmation will follow by email.`,
    `Services you can mention if asked: ${company.services.join(", ")}.`,
  ].join(" ");
}

// A short scripted exchange used by the live-call simulation + shown on the Calls page.
export function simulatedTranscript(o: Opp): { speaker: "agent" | "owner"; text: string }[] {
  const neighborhood = "the area";
  return [
    { speaker: "agent", text: `Hi, this is ${company.rep} with ${company.name} — we do commercial HVAC around ${neighborhood}. I'm calling about ${o.address}; I saw it had ${signalPhrase(o)}. Do you have a quick second?` },
    { speaker: "owner", text: `Uh, sure. What's this about?` },
    { speaker: "agent", text: `Totally — we can come take a look before it turns into a bigger repair. We do a free 30-minute inspection. Would Thursday at 2pm or Friday morning work better?` },
    { speaker: "owner", text: `Thursday at 2 could work.` },
    { speaker: "agent", text: `Great — I'll lock in Thursday at 2pm for ${o.address}. You'll get a confirmation by email. Thanks for your time!` },
  ];
}

export const BOOKING_SLOTS = ["Thu 2:00 PM", "Fri 10:00 AM", "Mon 9:30 AM"];
