import { NextRequest, NextResponse } from "next/server";
import { systemPrompt } from "@/data/voiceAgent";

const VAPI = "https://api.vapi.ai";
const DEMO_PHONE = process.env.DEMO_PHONE || "+14155062042";
// Vapi tools (Google Calendar create-event + Slack message) — created against the connected credentials
const TOOL_IDS = ["31a71a29-63fa-4d68-a16c-74ff9117161d", "7368893b-f0d3-44db-b069-9514b6a03ed8"];

function opener(o: { address?: string; signals?: string; systemAge?: string }) {
  // Lead with identity/address verification — confirm the right person and building before pitching.
  return `Hi, this is Alex with Summit Mechanical, a licensed HVAC contractor here in San Francisco. Quick check before I go on — am I speaking with the owner or property manager for ${o.address}?`;
}

// POST → place a real outbound Vapi call to the demo number
export async function POST(req: NextRequest) {
  const key = process.env.VAPI_API_KEY;
  if (!key) return NextResponse.json({ error: "VAPI not configured" }, { status: 501 });
  const o = await req.json().catch(() => ({}));
  // the model has no clock — give it today's date so it schedules upcoming dates (not 2023)
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Los_Angeles" });
  const sys = `${systemPrompt(o)} For scheduling: today is ${today} (Pacific Time). Always book an UPCOMING date in ${new Date().getFullYear()} or later — never a past date. When creating the calendar event, use a full ISO datetime with the correct year and the America/Los_Angeles timezone.`;
  const body = {
    assistantId: process.env.VAPI_ASSISTANT_ID,
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    customer: { number: DEMO_PHONE },
    assistantOverrides: {
      firstMessage: opener(o),
      endCallFunctionEnabled: true, // let the agent actually hang up when the booking is done
      // override the assistant's system prompt so it speaks as the HVAC contractor (not its default persona)
      model: { provider: "openai", model: "gpt-4o", messages: [{ role: "system", content: sys }], toolIds: TOOL_IDS },
      variableValues: { address: o.address, signal: (o.signals || "").replace(/_/g, " "), systemAge: o.systemAge || "", why: o.why || "" },
      // extract the REAL agreed time + email from the call (so the UI shows what was actually said)
      analysisPlan: {
        structuredDataPlan: {
          enabled: true,
          messages: [{ role: "system", content: "From the call transcript, extract the booking outcome. Use the exact day/time the owner agreed to." }],
          schema: {
            type: "object",
            properties: {
              booked: { type: "boolean", description: "true if the owner agreed to an inspection time" },
              datetime: { type: "string", description: "the agreed day and time exactly as spoken, e.g. 'Thursday 5 PM'" },
              email: { type: "string", description: "the email address the owner gave, if any" },
            },
          },
        },
      },
    },
  };
  const r = await fetch(`${VAPI}/call`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ error: data?.message || "vapi error", detail: data }, { status: r.status });
  return NextResponse.json({ id: data.id, status: data.status, phone: DEMO_PHONE });
}

// GET ?id= → poll status + transcript
export async function GET(req: NextRequest) {
  const key = process.env.VAPI_API_KEY;
  const id = req.nextUrl.searchParams.get("id");
  if (!key || !id) return NextResponse.json({ error: "missing key or id" }, { status: 400 });
  const r = await fetch(`${VAPI}/call/${id}`, { headers: { Authorization: `Bearer ${key}` } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ error: d?.message || "vapi error" }, { status: r.status });
  const raw = d.messages || d.artifact?.messages || [];
  const messages = raw
    .filter((m: any) => ["assistant", "bot", "user"].includes(m.role))
    .map((m: any) => ({ speaker: m.role === "user" ? "owner" : "agent", text: m.message || m.content || "" }))
    .filter((t: any) => t.text);
  return NextResponse.json({
    status: d.status,
    endedReason: d.endedReason ?? null,
    transcript: d.transcript ?? null,
    summary: d.analysis?.summary ?? null,
    structuredData: d.analysis?.structuredData ?? null, // { booked, datetime, email }
    messages,
  });
}
