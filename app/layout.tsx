import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lazor Pass",
  description:
    "Lazor Pass is a Web3 access layer that removes friction from crypto onboarding and payments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          font-sans
          h-dvh
          grid
          grid-rows-[auto_1fr_auto]
          overflow-hidden
        `}
      >
        
        
          <header className="sticky top-0 z-50">
            <Navbar />
          </header>

          <main className="overflow-y-auto">
            {children}
          </main>

          <footer className="sticky bottom-0 z-50">
            <Footer />
          </footer>
        
      </body>
    </html>
  );
}