import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/navbar";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "RateMe - Rate Faces",
  description: "Rate faces from 1-10 and upload your own",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RateMe",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F5F3EE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className="antialiased"
      >
        <ServiceWorkerRegistrar />
        <Navbar />
        <main className="container mx-auto max-w-lg px-5 py-6">{children}</main>
      </body>
    </html>
  );
}
