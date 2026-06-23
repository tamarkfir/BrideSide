import type { Metadata } from "next";
import {
  Assistant,
  Bona_Nova,
  Cormorant_Garamond,
  Dancing_Script,
  Inter,
} from "next/font/google";
import "@/styles/globals.css";

/*
 * Cormorant Garamond ו-Inter (מהאפיון) לא כוללים גליפים עבריים,
 * לכן לצידם נטענים Bona Nova (כותרות) ו-Assistant (גוף) לעברית.
 * נוסף: Dancing Script למבטאי סקראפבוק לטיניים (שמות, תאריכים). לעברית אין פונט
 * כתב-יד זמין ב-next/font, ולכן מבטאים בעברית נופלים חזרה ל-Bona Nova.
 */
const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const headingHe = Bona_Nova({
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  variable: "--font-heading-he",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const bodyHe = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-body-he",
});

const scriptLatin = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "BrideSide",
  description: "בונות יחד את טקס החתונה שלכן",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heading.variable} ${headingHe.variable} ${body.variable} ${bodyHe.variable} ${scriptLatin.variable}`}
    >
      <body>
        {children}
        {/* Google Identity Services — נדרש לזרימת OAuth של Google Photos Picker */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script src="https://accounts.google.com/gsi/client" async defer />
      </body>
    </html>
  );
}
