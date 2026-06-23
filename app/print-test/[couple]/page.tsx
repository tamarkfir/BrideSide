import { readFileSync } from "fs";
import { join } from "path";
import PrintTestClient from "@/components/book/PrintTestClient";
import type { CeremonyBooklet as BookletType } from "@/lib/types";
import { initialState } from "@/lib/state";

export default async function PrintTestPage({ params }: { params: Promise<{ couple: string }> }) {
  const { couple } = await params;
  const filePath = join(process.cwd(), "test-output", `${couple}.json`);
  let booklet: BookletType;
  try {
    const raw = readFileSync(filePath, "utf8");
    booklet = JSON.parse(raw);
  } catch (err) {
    return (
      <div className="p-8 text-red-500 font-sans" dir="rtl">
        שגיאה בטעינת הקובץ עבור הזוג {couple}: {(err as Error).message}
      </div>
    );
  }

  const nameMap: Record<string, { a: string, b: string }> = {
    "avigail-roni": { a: "אביגיל", b: "רוני" },
    "dana-yael": { a: "דנה", b: "יעל" },
    "shira-michal": { a: "שירה", b: "מיכל" },
    "tal-mary": { a: "טל", b: "מרי" },
    "eden-shahar": { a: "עדן", b: "שחר" },
    "libi-rotem": { a: "ליבי", b: "רותם" }
  };
  const coupleNames = nameMap[couple] || { a: "כלה א", b: "כלה ב" };
  const state = initialState(coupleNames.a, coupleNames.b, []);

  return (
    <>
      {/* SVG filter needed for deckle edges and photo effects */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <filter id="deckle-edge">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.011" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <PrintTestClient
        initialBooklet={booklet}
        initialState={state}
      />
    </>
  );
}
