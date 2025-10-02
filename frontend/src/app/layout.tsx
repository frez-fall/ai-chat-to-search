import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Custom brand font with fallbacks
const brandFont = localFont({
  src: [
    {
      path: "./fonts/roobert-font-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/roobert-font-semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-brand",
  display: "swap", // Show fallback immediately
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

// Optional: Keep system monospace font for code blocks
// You can add a custom mono font later if needed
const monoFont = {
  variable: "--font-mono",
  // Using system mono fonts as fallback
};

export const metadata: Metadata = {
  title: "Paylater Travel AI Companion",
  description: "Find and book flights with our AI-powered search assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical font files for better performance */}
        <link
          rel="preload"
          href="/fonts/roobert-font-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/roobert-font-semibold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${brandFont.variable} ${monoFont.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
