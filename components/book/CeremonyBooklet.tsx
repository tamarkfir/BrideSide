"use client";

import { useMemo, useState } from "react";
import AutoTextarea from "@/components/ui/AutoTextarea";
import PageDecorations from "@/components/notebook/PageDecorations";
import { bookletVariant } from "@/lib/decorations";
import { autoTreatment, makeId } from "@/lib/state";
import type {
  CeremonyBooklet as Booklet,
  CeremonySection,
  CeremonySectionKind,
  PhotoItem,
  SessionState,
} from "@/lib/types";

/** תווית עברית קטנה לכל סוג קטע */
const KIND_LABEL: Record<CeremonySectionKind, string> = {
  imagery: "דמיון מודרך",
  flow: "מהלך הטקס",
  quote: "ציטוט",
  reading: "קטע קריאה",
  vow: "נדר",
  blessing: "ברכה",
  closing: "סיום",
};

/** קטעים ש"מודבקים" כדף מודפס נפרד (ציטוט/ברכה/נדר) */
function isPasted(kind: CeremonySectionKind): boolean {
  return kind === "quote" || kind === "reading" || kind === "blessing" || kind === "vow";
}

type Props = {
  booklet: Booklet;
  state: SessionState;
  onChange: (booklet: Booklet) => void;
  onBack: () => void;
};

export default function CeremonyBooklet({ booklet, state, onChange, onBack }: Props) {
  const [current, setCurrent] = useState(0);
  const [turning, setTurning] = useState<"out" | "in" | null>(null);

  // עמוד 0 = שער; אחריו קטע לכל עמוד
  const total = booklet.sections.length + 1;

  // תמונות לתצוגה מקדימה (מצב פיתוח בלבד) — כדי לראות איך הספרון נראה עם תמונות
  const isDev = process.env.NODE_ENV === "development";
  const [previewPhotos, setPreviewPhotos] = useState<PhotoItem[]>([]);

  // כל התמונות: קודם של התצוגה המקדימה, ואז מה שהזוג העלתה בשאלון
  const allPhotos = useMemo<PhotoItem[]>(
    () => [...previewPhotos, ...state.pages.flatMap((p) => p.photos)],
    [previewPhotos, state.pages]
  );

  // תמונה לשער - תמיד הראשונה
  const titlePhoto = allPhotos[0];

  function addPreviewPhotos(files: FileList) {
    Array.from(files).forEach((file, k) => {
      const reader = new FileReader();
      reader.onload = () =>
        setPreviewPhotos((prev) => [
          ...prev,
          {
            id: makeId("preview"),
            dataUrl: String(reader.result),
            caption: "",
            treatment: autoTreatment(previewPhotos.length + k),
            rotation: Math.round((Math.random() * 8 - 4) * 10) / 10,
          },
        ]);
      reader.readAsDataURL(file);
    });
  }

  // פיזור שווה של שאר התמונות בין עמודי התוכן של הספרון
  const photos = useMemo<(PhotoItem | undefined)[]>(() => {
    const contentPhotos = allPhotos.slice(1); // התמונה הראשונה תמיד בשער
    const result: (PhotoItem | undefined)[] = new Array(booklet.sections.length).fill(undefined);
    if (contentPhotos.length === 0 || booklet.sections.length === 0) return result;
    
    const numPhotos = Math.min(contentPhotos.length, booklet.sections.length);
    for (let i = 0; i < numPhotos; i++) {
      const targetIndex = Math.floor((i + 0.5) * (booklet.sections.length / numPhotos));
      result[targetIndex] = contentPhotos[i];
    }
    return result;
  }, [allPhotos, booklet.sections.length]);

  function goTo(page: number) {
    if (turning || page < 0 || page >= total || page === current) return;
    setTurning("out");
    window.setTimeout(() => {
      setCurrent(page);
      setTurning("in");
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => setTurning(null), 500);
    }, 400);
  }

  // חיפוש שיר הכניסה בסשן בשביל הנגן המרחף
  const entrancePage = state.pages.find((p) => p.key === "imagine_entrance");
  const entranceSong = entrancePage?.answers["entranceSong"]?.text || "";
  const isSpotify = entranceSong.startsWith("spotify:track:");
  const spotifyTrackId = isSpotify ? entranceSong.split("|")[0].replace("spotify:track:", "") : null;

  function updateSection(index: number, patch: Partial<CeremonySection>) {
    onChange({
      ...booklet,
      sections: booklet.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }

  const section = current > 0 ? booklet.sections[current - 1] : null;
  // השער בעיצוב קבוע; עמודי התוכן מקבלים תבנית עיצוב מתחלפת, שווה-בשווה
  const variant = bookletVariant(current);
  const photo = section ? photos[current - 1] : undefined;

  return (
    <>
      <main className="no-print mx-auto max-w-2xl px-6 pb-24 md:px-12">
        <header className="animate-fade-in space-y-2 py-6 text-center">
          <div
            className="flex flex-wrap justify-center gap-1.5"
            aria-label={`עמוד ${current + 1} מתוך ${total}`}
          >
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`עמוד ${i + 1}`}
                className={`h-2 w-2 rounded-full transition-colors duration-500 ${
                  i === current ? "bg-brand-rose" : i < current ? "bg-brand-rose/40" : "bg-brand-sand/30"
                }`}
              />
            ))}
          </div>
          <p className="script-accent text-xl">ספרון הטקס</p>
        </header>

        <div className="book-perspective relative">
          <div className="book-shell">
            <div
              className={`book-page paper relative min-h-[34rem] p-6 pb-14 md:p-8 md:pb-16 ${
                turning === "out" ? "page-turn-out" : turning === "in" ? "page-turn-in" : ""
              }`}
            >
              <PageDecorations variant={variant} />
              <div className="relative z-10">
                <div className={current === 0 ? "block" : "hidden"}>
                  <TitlePage booklet={booklet} state={state} photo={titlePhoto} onChange={onChange} />
                </div>
                {current > 0 && section ? (
                  <SectionPage
                    section={section}
                    photo={photo}
                    onChange={(patch) => updateSection(current - 1, patch)}
                  />
                ) : null}
              </div>
              <p className="absolute inset-x-0 bottom-5 z-10 text-center font-heading text-sm text-brand-sand">
                — {current + 1} —
              </p>
            </div>
          </div>

          {/* דפדוף בלחיצה על שולי הדף (ספר עברי: שמאל=הבא, ימין=הקודם) */}
          {current < total - 1 && (
            <button
              type="button"
              aria-label="לעמוד הבא"
              onClick={() => goTo(current + 1)}
              disabled={turning !== null}
              className="group absolute inset-y-0 left-0 z-20 flex w-7 items-center justify-center md:w-9"
            >
              <span className="text-2xl text-brand-rose/0 transition group-hover:text-brand-rose/50">‹</span>
            </button>
          )}
          {current > 0 && (
            <button
              type="button"
              aria-label="לעמוד הקודם"
              onClick={() => goTo(current - 1)}
              disabled={turning !== null}
              className="group absolute inset-y-0 right-0 z-20 flex w-7 items-center justify-center md:w-9"
            >
              <span className="text-2xl text-brand-rose/0 transition group-hover:text-brand-rose/50">›</span>
            </button>
          )}
        </div>

        <nav className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0 || turning !== null}
            className="chip-organic px-5 py-2 text-base disabled:opacity-30"
          >
            → הקודם
          </button>
          <span className="text-sm text-brand-sand">
            {current + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === total - 1 || turning !== null}
            className="chip-organic active-gold px-6 py-2 text-base font-medium disabled:opacity-30"
          >
            הבא ←
          </button>
        </nav>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-brand-rose px-8 py-3 text-base text-white shadow-sm transition hover:bg-brand-roseDark"
          >
            הורדת הספרון (PDF / הדפסה)
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-brand-rose/40 px-6 py-3 text-base text-brand-roseDark transition hover:bg-brand-rose/5"
          >
            → חזרה לעריכת התשובות
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-brand-sand">
          טיפ: לחצו על כל טקסט בספרון כדי לערוך אותו במילים שלכן.
        </p>

        {isDev && (
          <div className="mt-3 text-center">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-brand-sand/60 px-4 py-2 text-sm text-brand-sand transition hover:border-brand-rose hover:text-brand-roseDark">
              ➕ הוספת תמונות לתצוגה (פיתוח)
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addPreviewPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {previewPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => setPreviewPhotos([])}
                className="ml-3 text-sm text-brand-sand underline transition hover:text-brand-roseDark"
              >
                ניקוי ({previewPhotos.length})
              </button>
            )}
          </div>
        )}

        {isSpotify && spotifyTrackId && (
          <div className="fixed bottom-6 left-6 z-50 animate-fade-in-up">
            <iframe
              src={`https://open.spotify.com/embed/track/${spotifyTrackId}`}
              width="300"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl shadow-xl border border-brand-sand/30"
            ></iframe>
          </div>
        )}
      </main>

      <BookletPrint booklet={booklet} photos={photos} titlePhoto={titlePhoto} />
    </>
  );
}

/* =================== שער =================== */

function TitlePage({ booklet, state, photo, onChange }: { booklet: Booklet; state: SessionState; photo?: PhotoItem; onChange: (b: Booklet) => void }) {
  return (
    <div className="flex min-h-[26rem] flex-col items-center justify-center gap-6 text-center">
      {/* משבצת תמונה בגובה קבוע — כך שמיקום הטקסט נשאר זהה עם תמונה או בלעדיה */}
      <div className="flex h-44 items-center justify-center">
        {photo && (
          <figure
            className={`photo-frame treat-${photo.treatment}`}
            style={{ transform: `rotate(${photo.rotation}deg)`, maxWidth: "10rem" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.editedUrl ?? photo.dataUrl}
              alt={photo.caption || "שער"}
              className="block max-h-40 w-auto rounded-sm"
            />
          </figure>
        )}
      </div>
      <div className="flex flex-col items-center gap-5">
        <p className="script-accent text-xl">BrideSide</p>
        <EditableText
          value={booklet.title}
          onChange={(title) => onChange({ ...booklet, title })}
          className="font-heading text-4xl leading-snug text-brand-roseDark md:text-5xl"
          ariaLabel="כותרת הספרון"
        />
        {booklet.dedication !== undefined && (
          <EditableText
            value={booklet.dedication}
            onChange={(dedication) => onChange({ ...booklet, dedication })}
            className="max-w-md text-lg italic leading-relaxed text-brand-ink/70"
            multiline
            placeholder="משפט הקדשה…"
            ariaLabel="הקדשה"
          />
        )}
      </div>
    </div>
  );
}

/* =================== עמוד קטע =================== */

function SectionPage({
  section,
  photo,
  onChange,
}: {
  section: CeremonySection;
  photo?: PhotoItem;
  onChange: (patch: Partial<CeremonySection>) => void;
}) {
  const pasted = isPasted(section.kind);

  const bodyEl = (
    <EditableText
      value={section.body}
      onChange={(body) => onChange({ body })}
      className={`whitespace-pre-line leading-loose ${
        section.kind === "imagery" ? "text-lg italic text-brand-ink/80" : "text-base text-brand-ink"
      }`}
      multiline
      ariaLabel="תוכן הקטע"
    />
  );

  return (
    <div className="space-y-5">
      <p className="script-accent text-base">{KIND_LABEL[section.kind]}</p>
      <EditableText
        value={section.title}
        onChange={(title) => onChange({ title })}
        className="font-heading text-2xl text-brand-roseDark"
        ariaLabel="כותרת הקטע"
      />

      {pasted ? (
        <div
          className={`note-card space-y-3 ${
            section.kind === "blessing" || section.kind === "vow" ? "note-blush" : "note-kraft"
          }`}
        >
          <span className="washi-tape" aria-hidden />
          {bodyEl}
          {section.attribution !== undefined && (
            <EditableText
              value={section.attribution}
              onChange={(attribution) => onChange({ attribution })}
              className="block text-left text-sm text-brand-sand"
              placeholder="מקור / שם"
              ariaLabel="מקור הציטוט"
            />
          )}
        </div>
      ) : (
        bodyEl
      )}

      {photo && (
        <figure className={`photo-frame mx-auto w-44 treat-${photo.treatment}`} style={{ transform: `rotate(${photo.rotation}deg)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.editedUrl ?? photo.dataUrl} alt={photo.caption || "תמונה"} className="block w-full rounded-sm" />
          {photo.caption && (
            <figcaption className="pt-1 text-center text-sm text-brand-sand">{photo.caption}</figcaption>
          )}
        </figure>
      )}
    </div>
  );
}

/* =================== טקסט הניתן לעריכה במקום =================== */

function EditableText({
  value,
  onChange,
  className = "",
  multiline = false,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEditing() {
    setDraft(value);
    setEditing(true);
  }
  function commit() {
    onChange(draft);
    setEditing(false);
  }

  if (editing) {
    const editClass = `${className} w-full rounded-xl bg-white/80 px-3 py-2 outline-none ring-2 ring-brand-rose/40`;
    return multiline ? (
      <AutoTextarea
        autoFocus
        minRows={2}
        value={draft}
        aria-label={ariaLabel}
        className={editClass}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
      />
    ) : (
      <input
        type="text"
        autoFocus
        value={draft}
        aria-label={ariaLabel}
        className={editClass}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
      />
    );
  }

  return (
    <p
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={startEditing}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && startEditing()}
      className={`${className} cursor-text rounded-xl transition hover:bg-brand-rose/5 ${
        !value ? "text-brand-sand" : ""
      }`}
    >
      {value || placeholder || "…"}
    </p>
  );
}

/* =================== גרסת הדפסה / PDF =================== */

function BookletPrint({ booklet, photos, titlePhoto }: { booklet: Booklet; photos: (PhotoItem | undefined)[]; titlePhoto?: PhotoItem }) {
  // איחוד כל העמודים למערך אחד
  type PrintPage =
    | { type: "title" }
    | { type: "section"; section: CeremonySection; photo?: PhotoItem; index: number }
    | { type: "empty" };
  const allPages: PrintPage[] = [
    { type: "title" },
    ...booklet.sections.map((s, i) => ({ type: "section" as const, section: s, photo: photos[i], index: i })),
  ];

  // אם מספר העמודים אי זוגי, נוסיף עמוד ריק בסוף כדי להשלים צמד
  if (allPages.length % 2 !== 0) {
    allPages.push({ type: "empty" });
  }

  // חלוקה לצמדים (Spreads) - כל צמד הוא דף A4 שוכב, המכיל 2 עמודים
  const spreads = [];
  for (let i = 0; i < allPages.length; i += 2) {
    spreads.push([allPages[i], allPages[i + 1]]);
  }

  const renderPageContent = (page: any) => {
    if (page.type === "title") {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 text-center pt-4 flex-1">
          {titlePhoto && (
            <figure className={`photo-frame mx-auto w-36 treat-${titlePhoto.treatment} mb-4`} style={{ transform: `rotate(${titlePhoto.rotation}deg)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={titlePhoto.editedUrl ?? titlePhoto.dataUrl} alt={titlePhoto.caption || "שער"} className="block w-full max-h-[35vh] object-cover rounded-sm" />
            </figure>
          )}
          <p className="script-accent text-xl">BrideSide</p>
          <h1 className="font-heading text-4xl leading-snug text-brand-roseDark">{booklet.title}</h1>
          {booklet.dedication && <p className="max-w-md mx-auto text-lg italic leading-relaxed text-brand-ink/70">{booklet.dedication}</p>}
        </div>
      );
    }
    if (page.type === "section") {
      const section = page.section as CeremonySection;
      const photo = page.photo as PhotoItem | undefined;
      const pasted = isPasted(section.kind);
      
      return (
        <div className="flex flex-col space-y-3 pt-2 px-2 flex-1">
          <div>
            <p className="script-accent text-base mb-1">{KIND_LABEL[section.kind]}</p>
            <h2 className="font-heading text-2xl text-brand-roseDark">{section.title}</h2>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {pasted ? (
              <div className={`note-card space-y-2 p-4 ${section.kind === "blessing" || section.kind === "vow" ? "note-blush" : "note-kraft"}`}>
                <span className="washi-tape" aria-hidden />
                <p className="whitespace-pre-line leading-relaxed text-sm text-brand-ink">{section.body}</p>
                {section.attribution && <p className="block text-left text-xs text-brand-sand">— {section.attribution}</p>}
              </div>
            ) : (
              <p className={`whitespace-pre-line leading-relaxed ${section.kind === "imagery" ? "text-base italic text-brand-ink/80" : "text-sm text-brand-ink"}`}>
                {section.body}
              </p>
            )}
          </div>

          {photo && (
            <figure className={`photo-frame mx-auto w-32 treat-${photo.treatment} mt-2`} style={{ transform: `rotate(${photo.rotation}deg)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.editedUrl ?? photo.dataUrl} alt={photo.caption || "תמונה"} className="block w-full max-h-[25vh] object-cover rounded-sm" />
              {photo.caption && <figcaption className="pt-1 text-center text-xs text-brand-sand">{photo.caption}</figcaption>}
            </figure>
          )}
        </div>
      );
    }
    return <div></div>;
  };

  return (
    <div className="print-only bg-brand-blush" dir="rtl">
      {spreads.map((spread, i) => (
        <div key={i} className="print-page-wrapper">
          <div className="print-spread flex gap-8 p-10 bg-brand-blush items-stretch">
            {/* עמוד ימני (הראשון בצמד - RTL) */}
            <div className="flex-1 paper relative p-10 rounded-2xl border border-brand-sand/30 shadow-sm flex flex-col">
              <PageDecorations variant={bookletVariant(i * 2)} editable={false} />
              <div className="relative z-10 flex-1 flex flex-col print-block-layout">
                {renderPageContent(spread[0])}
              </div>
              {spread[0].type !== "empty" && <p className="relative z-10 mt-8 text-center font-heading text-base text-brand-sand">— {i * 2 + 1} —</p>}
            </div>
            {/* עמוד שמאלי */}
            <div className="flex-1 paper relative p-10 rounded-2xl border border-brand-sand/30 shadow-sm flex flex-col">
              <PageDecorations variant={bookletVariant(i * 2 + 1)} editable={false} />
              <div className="relative z-10 flex-1 flex flex-col print-block-layout">
                {renderPageContent(spread[1])}
              </div>
              {spread[1].type !== "empty" && <p className="relative z-10 mt-8 text-center font-heading text-base text-brand-sand">— {i * 2 + 2} —</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
