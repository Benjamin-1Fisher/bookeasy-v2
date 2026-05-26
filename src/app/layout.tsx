import type { Metadata } from "next";
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/500.css";
import "@fontsource/heebo/600.css";
import "@fontsource/heebo/700.css";
import "@fontsource/heebo/800.css";
import { LocaleProvider } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookEasy | Smart booking links for small service businesses",
  description:
    "Turn WhatsApp and Instagram booking chaos into one smart booking link with Hebrew and English support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
