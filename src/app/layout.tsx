import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nara Labs",
  description: "An AI signal engine for HVAC contractor growth.",
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
