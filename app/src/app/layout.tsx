import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MotivReel — Swipe. Inspire. Rise.",
  description:
    "A curated collection of motivational reels from YouTube, Instagram, and ShareChat. Swipe through powerful videos and ignite your drive.",
  keywords: ["motivation", "reels", "inspiration", "youtube shorts", "instagram reels"],
  openGraph: {
    title: "MotivReel — Swipe. Inspire. Rise.",
    description: "Curated motivational reels to ignite your drive.",
    type: "website",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
