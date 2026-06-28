import Link from "next/link";
import { Building2, MapPin } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_32rem)]">
      <header className="border-b border-card-border/80 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">ReadyLead</p>
              <p className="text-xs text-muted">HVAC GTM signal engine</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/map"
              className="flex items-center gap-1.5 rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground"
            >
              <MapPin className="h-4 w-4" /> Map
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground"
            >
              Demo Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </main>
  );
}
