import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookEasy | לינק הזמנות חכם לעסק קטן",
  description:
    "BookEasy מאפשר לעסק שלך להציג שירותים, מחירים וזמנים פנויים, והלקוחות מזמינים דרך לינק אחד.",
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
