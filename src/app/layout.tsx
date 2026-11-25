import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YepNope — Decisioni di gruppo in un secondo",
  description:
    "Crea una stanza privata senza login, condividi il link su WhatsApp e fai swipe con gli amici fino al primo match unanime.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YepNope",
  },
  openGraph: {
    title: "YepNope — Swipe di gruppo, zero discussioni",
    description:
      "Cosa si mangia, cosa guardiamo, cosa facciamo o liste libere. Entra senza registrazione e trova subito il match unanime.",
    type: "website",
    locale: "it_IT",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F6F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0F12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${plusJakarta.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full app-shell">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
