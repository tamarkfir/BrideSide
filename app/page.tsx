"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { runGooglePhotosPicker } from "@/lib/gphotosClient";
import { resizeImage, setPhotoPool } from "@/lib/photoStore";
import { UI_TEXT } from "@/lib/prompts";
import PageDecorations from "@/components/notebook/PageDecorations";

/** כמה תמונות מותר להעלות מראש */
const MAX_PHOTOS = 40;

/** webkitdirectory לא קיים בטיפוסים של React — מאפשר בחירת תיקייה שלמה */
const directoryProps = {
  webkitdirectory: "",
} as unknown as React.InputHTMLAttributes<HTMLInputElement>;

export default function LandingPage() {
  const router = useRouter();
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [gphotosLoading, setGphotosLoading] = useState(false);
  const [gphotosError, setGphotosError] = useState<string | null>(null);
  const [isEditingDecor, setIsEditingDecor] = useState(false);

  const ready = nameA.trim().length > 0 && nameB.trim().length > 0;

  async function addFiles(files: FileList) {
    setProcessing(true);
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const room = MAX_PHOTOS - photos.length;
    const resized: string[] = [];
    for (const file of images.slice(0, room)) {
      try {
        resized.push(await resizeImage(file));
      } catch {
        // קובץ שלא נקרא — מדלגים בשקט
      }
    }
    setPhotos((prev) => [...prev, ...resized]);
    setProcessing(false);
  }

  async function handleGooglePhotos() {
    setGphotosError(null);
    setGphotosLoading(true);
    const result = await runGooglePhotosPicker();
    setGphotosLoading(false);
    if (!result.ok) {
      const messages: Record<string, string> = {
        missing_client_id: "חסר Client ID של Google — הגדירו ב-.env.local",
        auth_cancelled: "ההתחברות לגוגל בוטלה",
        session_failed: "לא הצלחנו ליצור סשן — נסו שוב",
        selection_timeout: "הזמן לבחירת תמונות פג — נסו שוב",
        fetch_failed: "לא הצלחנו לטעון את התמונות — נסו שוב",
        unexpected_error: "משהו השתבש — נסו שוב",
      };
      setGphotosError(messages[result.error] ?? "שגיאה לא ידועה");
      return;
    }
    const room = MAX_PHOTOS - photos.length;
    setPhotos((prev) => [...prev, ...result.photos.slice(0, room)]);
  }

  function start() {
    if (!ready) return;
    sessionStorage.setItem(
      "brideside:names",
      JSON.stringify({ a: nameA.trim(), b: nameB.trim() })
    );
    setPhotoPool(photos);
    router.push("/session");
  }

  /** פיתוח בלבד: קופצים ישר לספרון לדוגמה עם התמונות שהועלו כאן — לראות את הספר המלא */
  function previewBook() {
    sessionStorage.setItem(
      "brideside:names",
      JSON.stringify({ a: nameA.trim() || "נועה", b: nameB.trim() || "תמר" })
    );
    setPhotoPool(photos);
    router.push("/session?book=sample");
  }

  const inputClass =
    "w-full field-paper px-6 py-5 text-lg outline-none placeholder:text-brand-sand/80 text-brand-ink font-medium";

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden px-6 py-16 md:px-12">
      <div className="relative mx-auto w-full max-w-2xl">
        <PageDecorations variant="Landing" />
        
        <div className="animate-fade-in relative z-10 w-full space-y-8 text-center">
          <div className="space-y-3">
            <p className="script-accent text-2xl">welcome</p>
            <h1 className="font-heading text-6xl leading-none text-brand-roseDark">{UI_TEXT.appName}</h1>
            <p className="mx-auto max-w-md text-lg leading-relaxed text-brand-sand">{UI_TEXT.tagline}</p>
          </div>

          <div className="space-y-6 rounded-2xl border border-brand-kraft/30 bg-brand-cream/90 p-7 shadow-sm backdrop-blur-sm md:p-8">
            <p className="text-base leading-relaxed">
              ברוכות הבאות לתהליך בניית הטקס שלכן לחתונה, שכל כולו מהצד של הכלה.
              <br />
              נצא מהמקום שבו אתן נמצאות, וצעד-צעד נבנה טקס שמרגיש שלכן, ונציג את החזון שלכן בספרון טקס ייחודי.
            </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
          >
            {/* רובריקת השמות */}
            <div className="space-y-3 rounded-2xl bg-white/50 p-5 text-right">
              <p className="text-base text-brand-roseDark">השמות שלכן</p>
              <input
                className={inputClass}
                value={nameA}
                onChange={(e) => setNameA(e.target.value)}
                placeholder="השם של כלה אחת"
                aria-label="השם של כלה אחת"
              />
              <input
                className={inputClass}
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                placeholder="השם של הכלה השנייה"
                aria-label="השם של הכלה השנייה"
              />
            </div>

            {/* איסוף תמונות מראש — נשלבות אוטומטית בעמודי הספר */}
            <div className="space-y-3 rounded-2xl bg-white/50 p-5 text-right">
              <p className="text-base text-brand-roseDark">
                התמונות שלכן
                <span className="mr-2 text-sm text-brand-sand">
                  — נשלב אותן בעמודי הספר. אפשר להעלות הרבה, או לדלג.
                </span>
              </p>

              {photos.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {photos.map((src, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`תמונה ${i + 1}`}
                          className="h-16 w-16 rounded-xl object-cover shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                          aria-label="הסרת תמונה"
                          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-brand-roseDark shadow"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-brand-sand">{photos.length} תמונות נבחרו</p>
                </>
              )}

              {photos.length < MAX_PHOTOS && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-brand-kraft/50 px-5 py-2 text-sm text-brand-sand transition hover:border-brand-rose hover:text-brand-roseDark">
                    {processing ? "מעבדת…" : "+ תמונות"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      aria-label="העלאת תמונות"
                      onChange={(e) => {
                        if (e.target.files?.length) addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-brand-kraft/50 px-5 py-2 text-sm text-brand-sand transition hover:border-brand-rose hover:text-brand-roseDark">
                    + תיקייה שלמה
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      {...directoryProps}
                      className="hidden"
                      aria-label="העלאת תיקייה"
                      onChange={(e) => {
                        if (e.target.files?.length) addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {/* Google Photos Picker - Currently disabled by user request, set to true to re-enable */}
                  {false && (
                    <button
                      type="button"
                      onClick={handleGooglePhotos}
                      disabled={gphotosLoading}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-brand-kraft/50 px-5 py-2 text-sm text-brand-sand transition hover:border-brand-rose hover:text-brand-roseDark disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                        <path fill="#EA4335" d="M12 2a5 5 0 0 1 5 5v5h-5V2Z" />
                        <path fill="#4285F4" d="M22 12a5 5 0 0 1-5 5h-5v-5h10Z" />
                        <path fill="#34A853" d="M12 22a5 5 0 0 1-5-5v-5h5v10Z" />
                        <path fill="#FBBC05" d="M2 12a5 5 0 0 1 5-5h5v5H2Z" />
                      </svg>
                      {gphotosLoading ? "מייבאת מגוגל…" : "Google Photos"}
                    </button>
                  )}
                </div>
              )}

              {false && gphotosError && (
                <p className="text-sm text-red-500/80">{gphotosError}</p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Button type="submit" disabled={!ready || processing}>
                נתחיל
              </Button>
              {process.env.NODE_ENV === "development" && (
                <button
                  type="button"
                  onClick={previewBook}
                  disabled={processing}
                  className="block w-full rounded-full border border-dashed border-brand-kraft/50 px-5 py-2 text-sm text-brand-sand transition hover:border-brand-rose hover:text-brand-roseDark disabled:opacity-50"
                >
                  📖 תצוגת ספר מלא עם התמונות (פיתוח)
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      </div>

      {/* כפתור פיתוח לסידור פרחים בדף הבית */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => setIsEditingDecor((x) => !x)}
          className="fixed bottom-4 left-4 z-50 rounded-full bg-white/90 px-4 py-2 text-sm shadow backdrop-blur transition hover:bg-white"
        >
          {isEditingDecor ? "✅ סיום עריכה" : "🌿 סדרו פרחים"}
        </button>
      )}
    </main>
  );
}
