"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Radio, Send } from "lucide-react";

const NAV = [
  { href: "/signals", label: "Signals", icon: Radio },
  { href: "/calls", label: "Outreach", icon: Send },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="min-h-screen">
      <header className="border-b border-card-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">ReadyLead</p>
              <p className="text-[11px] text-muted">HVAC GTM signal engine</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1 rounded-full border border-card-border bg-card p-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${active ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </main>
  );
}
