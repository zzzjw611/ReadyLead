import { AppShell } from "@/components/Shell";
import { OpportunityBoard } from "@/components/dashboard/OpportunityBoard";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
          Demo dashboard
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Building Opportunity Board
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          AI-ranked maintenance opportunities for HVAC contractors.
        </p>
      </div>

      <OpportunityBoard />
    </AppShell>
  );
}
