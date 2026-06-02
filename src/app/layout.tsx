import type { Metadata } from "next";
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/500.css";
import "@fontsource/heebo/600.css";
import "@fontsource/heebo/700.css";
import "@fontsource/heebo/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookEasy | לינק הזמנות חכם לעסק קטן",
  description:
    "BookEasy מאפשר לעסק שלך להציג שירותים, מחירים וזמנים פנויים, עם מזכירה אוטומטית שמטפלת באישורים, תזכורות וביטולים.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
