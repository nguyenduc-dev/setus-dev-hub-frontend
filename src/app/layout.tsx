import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import PasswordGate from "@/components/PasswordGate";
import MainLayout from "@/components/MainLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Setus Game Hub",
  description: "Internal dev workspace for Shadow Hunters",
};

// No duplicate import needed here

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex antialiased bg-zinc-950 text-zinc-50 selection:bg-indigo-500/30">
        <Providers>
          <PasswordGate>
            <MainLayout>{children}</MainLayout>
          </PasswordGate>
        </Providers>
      </body>
    </html>
  );
}
