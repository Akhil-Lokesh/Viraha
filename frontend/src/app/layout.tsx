import type { Metadata, Viewport } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import { VirahaMuiProvider } from "@/lib/providers/mui-theme-provider";
import { CsrfInitializer } from "@/components/auth/csrf-initializer";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1025" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Viraha — Keep your travels alive",
    template: "%s | Viraha",
  },
  description:
    "The ache of separation from what you love. A travel memory platform where every journey finds its place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Viraha",
  },
  openGraph: {
    title: "Viraha — Keep your travels alive",
    description:
      "Preserve your travel memories. Map your journeys. Share your story.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: 'var(--font-body)' }}>
        <AppRouterCacheProvider>
          <VirahaMuiProvider>
            <QueryProvider>
              <CsrfInitializer />
              {children}
              <Toaster richColors position="top-center" />
            </QueryProvider>
          </VirahaMuiProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
