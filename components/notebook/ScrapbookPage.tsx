"use client";

import { type Dispatch } from "react";
import AutoTextarea from "@/components/ui/AutoTextarea";
import BrideInput from "@/components/ui/BrideInput";
import SpotifySearch from "@/components/ui/SpotifySearch";
import Chips from "./Chips";
import PhotoCollage from "./PhotoCollage";
import { TRADITIONS, type QField, type QPage } from "@/lib/questionnaire";
import { getAnswer, type SessionAction } from "@/lib/state";
import type { Answer, SessionState } from "@/lib/types";

type Props = {
  qPage: QPage;
  pageIndex: number;
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
};

/** החלפת אסימונים בנוסח השאלה */
function fill(text: string, a: string, b: string, partner?: string, name?: string): string {
  return text
    .replace(/{partner}/g, partner ?? `${a} ו${b}`)
    .replace(/{name}/g, name ?? "")
    .replace(/{names}/g, `${a} ו${b}`);
}

/** הוספת ערך לטקסט קיים עם מפריד */
function appendText(prev: string | undefined, value: string): string {
  const base = (prev ?? "").trim();
  if (!base) return value;
  if (base.includes(value)) return base;
  return `${base}, ${value}`;
}

export default function ScrapbookPage({ qPage, pageIndex, state, dispatch }: Props) {
  const page = state.pages[pageIndex];
  const { a, b } = state.brides;

  const setField = (fieldId: string, patch: Partial<Answer>) =>
    dispatch({ type: "SET_ANSWER", page: pageIndex, fieldId, patch });

  return (
    <div className="space-y-7">
      <p className="script-accent text-base">{qPage.group}</p>
      {qPage.intro && <p className="leading-relaxed text-brand-ink/80">{qPage.intro}</p>}

      {qPage.fields.map((field) => (
        <FieldControl
          key={field.id}
          field={field}
          ans={getAnswer(page, field.id)}
          page={page}
          a={a.name}
          b={b.name}
          setField={setField}
        />
      ))}

      {qPage.allowPhoto && (
        <PhotoCollage
          pageIndex={pageIndex}
          photos={page.photos}
          prompt={page.photos.length ? null : "אם יש תמונה שמספרת על העמוד הזה — אתן מוזמנות לצרף."}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}

/* =================== שדה בודד =================== */

function FieldControl({
  field,
  ans,
  page,
  a,
  b,
  setField,
}: {
  field: QField;
  ans: Answer;
  page: SessionState["pages"][number];
  a: string;
  b: string;
  setField: (fieldId: string, patch: Partial<Answer>) => void;
}) {
  const label = fill(field.label, a, b);

  const Q = (
    <div className="space-y-1">
      <p className="text-lg leading-relaxed text-brand-roseDark">{label}</p>
      {field.subLabel && <p className="text-sm text-brand-sand">{field.subLabel}</p>}
    </div>
  );

  const inputClass =
    "w-full field-paper px-5 py-4 text-base leading-relaxed outline-none placeholder:text-brand-sand/80";

  /* ---- text ---- */
  if (field.kind === "text") {
    return (
      <div className="space-y-2">
        {Q}
        <AutoTextarea
          minRows={1}
          className={inputClass}
          value={ans.text ?? ""}
          onChange={(e) => setField(field.id, { text: e.target.value })}
          placeholder={field.placeholder}
        />
        {field.suggestions && (
          <Chips items={field.suggestions} onPick={(s) => setField(field.id, { text: s })} />
        )}
      </div>
    );
  }

  /* ---- longtext ---- */
  if (field.kind === "longtext") {
    return (
      <div className="space-y-2">
        {Q}
        <AutoTextarea
          minRows={4}
          className={inputClass}
          value={ans.text ?? ""}
          onChange={(e) => setField(field.id, { text: e.target.value })}
          placeholder={field.placeholder}
        />
        {field.suggestions && (
          <Chips
            items={field.suggestions}
            onPick={(s) => setField(field.id, { text: appendText(ans.text, s) })}
          />
        )}
      </div>
    );
  }

  /* ---- perBride ---- */
  if (field.kind === "perBride") {
    const bride = ans.bride ?? { a: "", b: "" };
    // שאלה "מכוונת" — מזכירה את השם של הכותבת ו/או של בת הזוג, ולכן נשאלת לכל אחת בנפרד
    const directed = field.label.includes("{partner}") || field.label.includes("{name}");
    return (
      <div className="space-y-4">
        {directed
          ? field.subLabel && <p className="text-sm text-brand-sand">{field.subLabel}</p>
          : Q}
        {(["a", "b"] as const).map((key) => {
          const name = key === "a" ? a : b;
          const partner = key === "a" ? b : a;
          return (
            <div key={key} className="space-y-2">
              {directed ? (
                <>
                  <p className="text-lg leading-relaxed text-brand-roseDark">
                    {fill(field.label, a, b, partner, name)}
                  </p>
                  <AutoTextarea
                    minRows={3}
                    className={inputClass}
                    value={bride[key]}
                    onChange={(e) =>
                      setField(field.id, { bride: { ...bride, [key]: e.target.value } })
                    }
                    placeholder={fill(field.placeholder ?? "", a, b, partner, name)}
                  />
                </>
              ) : (
                <BrideInput
                  brideName={name}
                  value={bride[key]}
                  onChange={(v) => setField(field.id, { bride: { ...bride, [key]: v } })}
                  multiline
                  rows={4}
                  placeholder={fill(field.placeholder ?? "", a, b, partner)}
                />
              )}
              {field.suggestions && (
                <Chips
                  items={field.suggestions}
                  onPick={(s) =>
                    setField(field.id, { bride: { ...bride, [key]: appendText(bride[key], s) } })
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ---- chips (בחירה מרובה + הוספה) ---- */
  if (field.kind === "chips") {
    const list = ans.list ?? [];
    const toggle = (s: string) =>
      setField(field.id, {
        list: list.includes(s) ? list.filter((x) => x !== s) : [...list, s],
      });
    const custom = list.filter((s) => !(field.suggestions ?? []).includes(s));
    return (
      <div className="space-y-2">
        {Q}
        <Chips items={field.suggestions ?? []} onPick={toggle} isActive={(s) => list.includes(s)} />
        {custom.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {custom.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                className="rounded-full bg-brand-sage/20 px-3 py-1 text-sm text-brand-sageDark"
              >
                {s} ✕
              </button>
            ))}
          </div>
        )}
        <AddOwn onAdd={(s) => !list.includes(s) && setField(field.id, { list: [...list, s] })} />
      </div>
    );
  }

  /* ---- songs (עד 3) ---- */
  if (field.kind === "songs") {
    const list = ans.list ?? [];
    const setAt = (i: number, v: string) => {
      const next = [...list];
      next[i] = v;
      setField(field.id, { list: next.filter((s, idx) => s.trim() || idx < next.length - 1) });
    };
    const rows = [0, 1, 2];
    return (
      <div className="space-y-2">
        {Q}
        {rows.map((i) => (
          <SpotifySearch
            key={i}
            className={inputClass}
            value={list[i] ?? ""}
            onChange={(v) => setAt(i, v)}
            placeholder={field.placeholder}
          />
        ))}
        {field.suggestions && (
          <Chips
            items={field.suggestions}
            onPick={(s) => {
              const empty = list.findIndex((x) => !x.trim());
              const idx = empty === -1 ? Math.min(list.length, 2) : empty;
              setAt(idx, s);
            }}
          />
        )}
      </div>
    );
  }

  /* ---- spotify (חיפוש שיר בודד בספוטיפיי) ---- */
  if (field.kind === "spotify") {
    return (
      <div className="space-y-2">
        {Q}
        <SpotifySearch
          className={inputClass}
          value={ans.text ?? ""}
          onChange={(v) => setField(field.id, { text: v })}
          placeholder={field.placeholder}
        />
        {field.suggestions && (
          <Chips items={field.suggestions} onPick={(s) => setField(field.id, { text: s })} />
        )}
      </div>
    );
  }

  /* ---- yesno ---- */
  if (field.kind === "yesno") {
    return (
      <div className="space-y-2">
        {Q}
        <div className="flex gap-2">
          {([
            ["yes", "כן"],
            ["no", "לא"],
          ] as const).map(([val, txt]) => (
            <button
              key={val}
              type="button"
              onClick={() => setField(field.id, { yesno: ans.yesno === val ? "" : val })}
              className={`chip-organic px-6 py-2 text-base ${ans.yesno === val ? "active" : ""}`}
            >
              {txt}
            </button>
          ))}
        </div>
        {field.note && (
          <AutoTextarea
            minRows={2}
            className={inputClass}
            value={ans.note ?? ""}
            onChange={(e) => setField(field.id, { note: e.target.value })}
            placeholder="אם בא לכן — איך הייתן רוצות שזה יראה?"
          />
        )}
      </div>
    );
  }

  /* ---- choice ---- */
  if (field.kind === "choice") {
    return (
      <div className="space-y-2">
        {Q}
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setField(field.id, { choice: ans.choice === opt ? "" : opt })}
              className={`chip-organic px-5 py-2.5 text-base ${ans.choice === opt ? "active" : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>
        {field.note && (
          <AutoTextarea
            minRows={1}
            className={inputClass}
            value={ans.note ?? ""}
            onChange={(e) => setField(field.id, { note: e.target.value })}
            placeholder="או משהו אחר משלכן…"
          />
        )}
      </div>
    );
  }

  /* ---- traditions ---- */
  if (field.kind === "traditions") {
    return (
      <div className="space-y-3">
        {Q}
        <div className="note-card space-y-3">
          {TRADITIONS.map((topic) => (
            <TraditionRow key={topic} fieldId={field.id} topic={topic} page={page} setField={setField} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

/* רשימת מנהג בודד — כן / אולי / לא + איך לשלב */
function TraditionRow({
  fieldId,
  topic,
  page,
  setField,
}: {
  fieldId: string;
  topic: string;
  page: SessionState["pages"][number];
  setField: (fieldId: string, patch: Partial<Answer>) => void;
}) {
  const key = `${fieldId}__${topic}`;
  const ans = getAnswer(page, key);
  const choices: { value: string; label: string }[] = [
    { value: "in", label: "כן" },
    { value: "maybe", label: "אולי" },
    { value: "out", label: "לא" },
  ];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-base">{topic}</span>
        <div className="flex gap-1.5">
          {choices.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setField(key, { choice: ans.choice === c.value ? "" : c.value })}
              className={`rounded-full px-3 py-1 text-sm transition ${
                ans.choice === c.value
                  ? "bg-brand-rose text-white"
                  : "bg-white/70 text-brand-sand hover:text-brand-roseDark"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {ans.choice === "in" && (
        <AutoTextarea
          minRows={1}
          value={ans.note ?? ""}
          onChange={(e) => setField(key, { note: e.target.value })}
          placeholder="איך הייתן רוצות לעשות אותו בדרך שלכן?"
          className="w-full field-paper px-4 py-2.5 text-sm outline-none placeholder:text-brand-sand/80"
        />
      )}
    </div>
  );
}

/* תיבת "הוספה משלכן" לצ'יפים */
function AddOwn({ onAdd }: { onAdd: (value: string) => void }) {
  return (
    <input
      type="text"
      placeholder="להוסיף משלכן + Enter"
      className="w-full rounded-full bg-white/70 px-4 py-2 text-sm outline-none placeholder:text-brand-sand focus:ring-2 focus:ring-brand-rose/40"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const v = e.currentTarget.value.trim();
          if (v) {
            onAdd(v);
            e.currentTarget.value = "";
          }
        }
      }}
    />
  );
}
