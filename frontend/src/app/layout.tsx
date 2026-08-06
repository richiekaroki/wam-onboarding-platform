// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://onboarding-frontend.vercel.app"),
  title: {
    default: "Mr.Wam — Client Onboarding Platform",
    template: "%s | Mr.Wam",
  },
  description:
    "Dynamic onboarding forms for financial services — KYC, loans, investments, and more.",
  openGraph: {
    title: "Mr.Wam — Client Onboarding Platform",
    description:
      "Build and manage dynamic onboarding forms for financial services.",
    type: "website",
    locale: "en_US",
    url: "https://onboarding-frontend.vercel.app",
  },
  twitter: {
    card: "summary",
    title: "Mr.Wam — Client Onboarding Platform",
    description:
      "Dynamic onboarding forms for financial services — KYC, loans, investments.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

// Navbar is NOT rendered here because:
// 1. Some pages (login, register, homepage) have their own nav or no nav
// 2. Navbar uses client-only cookie auth — including it in a server layout
//    causes hydration mismatches
// Each page that needs the nav imports <Navbar /> directly.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}