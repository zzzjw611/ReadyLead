// Decision-maker contact for an opportunity.
//
// The contact waterfall (DataSF business registration → Enformion skip-trace →
// LeadMagic email validation) resolves the owner's real name, email and phone.
// Those are third-party PII and are deliberately NOT committed to this public
// repo — only the enrichment *confidence* travels with the opportunity.
//
// For the live demo: every outbound call rings the demo line, and the owner's
// real email is captured ON the call (they say it, the agent confirms it), then
// the Google Calendar invite is sent straight to that address. So the email
// field fills in from the call, not from a stored list.

// The number the live demo call actually dials (your demo phone), NOT the owner's
// real number. Display the real owner phone in the UI; this is only the dial target.
export const DEMO_PHONE = "+1 (415) 506-2042";

export type Contact = {
  role: string;                       // who the decision-maker is
  verified: "email" | "phone" | null; // what the waterfall actually validated
  note: string;                       // short status line for the UI
};

const ROLE: Record<string, string> = {
  "commercial-project": "Project / facilities lead",
  "commercial-repair": "Property manager",
  "replacement-candidate": "Building owner",
  "residential-repair": "Owner / landlord",
};

export function contactRole(segment?: string): string {
  return ROLE[segment || ""] || "Property manager";
}

export function deriveContact(o: { segment?: string; confidence?: string }): Contact {
  const role = contactRole(o.segment);
  const c = (o.confidence || "").toUpperCase();
  if (c.startsWith("HIGH"))
    return { role, verified: "email", note: "Verified email on file" };
  if (c.startsWith("MED"))
    return { role, verified: "phone", note: "Direct phone found · verify on the call" };
  return { role, verified: null, note: "Contact captured on the call" };
}
