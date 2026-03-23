import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import PasswordGate from "@/components/PasswordGate";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex antialiased bg-zinc-950 text-zinc-50 selection:bg-indigo-500/30">
        <Providers>
          <PasswordGate>
            <div className="flex h-screen w-full overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
          </PasswordGate>
        </Providers>
      </body>
    </html>
  );
}
