import type { Metadata } from "next";
import { Inter, Caveat, Orbitron } from "next/font/google";
import { Toaster } from "sonner";
import { TopBar } from "@features/role-switcher/top-bar";
import { HealthBanner } from "@features/health-banner/health-banner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caveat",
  weight: ["400", "600", "700"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Enya Lite — Personalized AI Tutor",
  description: "L4 personalized learning for K-12 EAL classrooms",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable} ${orbitron.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TopBar />
        <div className="pt-16">
          <HealthBanner />
          <main>{children}</main>
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
