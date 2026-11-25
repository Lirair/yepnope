import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { SeasonalBackdrop } from "@/components/SeasonalBackdrop";
import { THEME_BOOT_SCRIPT } from "@/lib/themes";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["700", "800"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
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
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0F13" },
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
      data-theme="base"
      className={`${outfit.variable} ${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-[100dvh] app-shell relative">
        <AppProviders>
          <SeasonalBackdrop />
          <div className="relative z-10 min-h-[100dvh] flex flex-col">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
