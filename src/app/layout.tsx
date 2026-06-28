import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReadyLead",
  description:
    "ReadyLead helps contractors find building maintenance leads before property managers request bids.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
