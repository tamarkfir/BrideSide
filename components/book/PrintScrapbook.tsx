import { QUESTIONNAIRE, TRADITIONS } from "@/lib/questionnaire";
import { getAnswer } from "@/lib/state";
import type { SessionState } from "@/lib/types";

/**
 * גרסת הדפסה / שמירה כ-PDF — סיכום פשוט של התשובות.
 * (הספרון הפואטי המלא נבנה ב-Phase 2.)
 */
export default function PrintScrapbook({ state }: { state: SessionState }) {
  const { a, b } = state.brides;
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="print-only px-12 py-8 text-brand-ink">
      <section className="print-page flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="mb-6 text-sm tracking-widest text-brand-sand">BrideSide</p>
        <h1 className="mb-4 text-5xl">
          {a.name} ו{b.name}
        </h1>
        <p className="text-lg text-brand-sand">החזון שלנו לטקס · {today}</p>
      </section>

      {QUESTIONNAIRE.map((qPage, i) => {
        const page = state.pages[i];
        if (!page) return null;
        return (
          <section key={qPage.key} className="py-6">
            <h2 className="mb-4 text-2xl text-brand-roseDark">{qPage.title}</h2>
            <div className="space-y-3">
              {qPage.fields.map((field) => {
                const ans = getAnswer(page, field.id);

                if (field.kind === "traditions") {
                  const rows = TRADITIONS.map((topic) => {
                    const t = getAnswer(page, `${field.id}__${topic}`);
                    if (!t.choice) return null;
                    const label = t.choice === "in" ? "כן" : t.choice === "maybe" ? "אולי" : "לא";
                    return `${topic}: ${label}${t.note ? ` — ${t.note}` : ""}`;
                  }).filter(Boolean);
                  if (!rows.length) return null;
                  return (
                    <p key={field.id} className="whitespace-pre-line leading-relaxed">
                      {rows.join("\n")}
                    </p>
                  );
                }

                const value =
                  field.kind === "perBride" && ans.bride
                    ? [ans.bride.a && `${a.name}: ${ans.bride.a}`, ans.bride.b && `${b.name}: ${ans.bride.b}`]
                        .filter(Boolean)
                        .join("\n")
                    : ans.list?.length
                    ? ans.list.join(", ")
                    : ans.choice
                    ? `${ans.choice}${ans.note ? ` (${ans.note})` : ""}`
                    : ans.yesno
                    ? `${ans.yesno === "yes" ? "כן" : "לא"}${ans.note ? ` — ${ans.note}` : ""}`
                    : ans.text ?? "";
                if (!value) return null;
                return (
                  <p key={field.id} className="whitespace-pre-line leading-relaxed">
                    {value}
                  </p>
                );
              })}

              {page.photos.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {page.photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={photo.id}
                      src={photo.editedUrl ?? photo.dataUrl}
                      alt={photo.caption || "תמונה"}
                      className="w-40 rounded-md"
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
