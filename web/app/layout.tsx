import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import { EntriesProvider } from "@/contexts/EntriesContext";
import { UserProvider } from "@/contexts/UserContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Max (by Hanz and Franz)",
  description:
    "Daily workouts and per-move weight tracking for the equipment at your gym.",
  appleWebApp: {
    capable: true,
    title: "Max",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/hanz-icon.png",
    apple: "/hanz-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <body className="min-h-full flex flex-col">
        <UserProvider>
          <EntriesProvider>
            <TopNav />
            {children}
          </EntriesProvider>
        </UserProvider>
      </body>
    </html>
  );
}
