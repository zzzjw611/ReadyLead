// Real enriched owner contacts (name / phone / email), keyed by address.
//
// These are PII (the waterfall's skip-traced results) so they are NOT committed.
// They come from NEXT_PUBLIC_CONTACTS_JSON, which lives only in .env.local
// (gitignored). When the env var is absent — e.g. a fresh clone or a public
// Vercel build without it set — this is empty and the UI falls back to
// "captured on the call". Set the env var locally to demo with real numbers.

export type RealContact = { name?: string; phone?: string; email?: string };

let LOCAL: Record<string, RealContact> = {};
try {
  LOCAL = JSON.parse(process.env.NEXT_PUBLIC_CONTACTS_JSON || "{}");
} catch {
  LOCAL = {};
}

export function realContact(address?: string): RealContact {
  return (address ? LOCAL[address] : undefined) || {};
}
