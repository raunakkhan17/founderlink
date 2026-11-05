import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FounderLink | Startup & Investor Platform",
  description: "Connect founders with investors, pitch startups, and monitor growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
