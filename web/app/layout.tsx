import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    icon: "/max-icon.png",
    apple: "/max-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16092e",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
