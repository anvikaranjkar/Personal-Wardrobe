import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Forme — Digital Wardrobe", template: "%s · Forme" },
  description: "A private, beautifully organized digital wardrobe and outfit studio.",
  openGraph: {
    type: "website",
    title: "Forme — Digital Wardrobe",
    description: "Your wardrobe, beautifully considered.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Forme — Your wardrobe, beautifully considered." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Forme — Digital Wardrobe",
    description: "Your wardrobe, beautifully considered.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f3f0ea",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
