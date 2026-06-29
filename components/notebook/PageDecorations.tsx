"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BOTANICALS,
  DECOR_STORAGE_KEY,
  DEFAULT_DECOR,
  type Deco,
  type DecoLayout,
} from "@/lib/decorations";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function readAll(): DecoLayout {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DECOR_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * שכבת הפרחים — מציגה את הקישוטים לפי הפריסה (lib/decorations.ts + מה שנשמר
 * מקומית), ובמצב פיתוח מאפשרת לסדר אותם ויזואלית (גרירה / גודל / סיבוב).
 */
export default function PageDecorations({
  variant,
  editable = true,
  buttonLabel = "🌿 סדרו פרחים",
  buttonOffset = 12,
}: {
  variant: string;
  /** האם להציג את עורך הפרחים (כפתור/פאנל). כבים אותו בעותקי-הדפסה כדי שלא
   *  יופיעו כמה כפתורי עריכה כפולים על אותה פינה. */
  editable?: boolean;
  /** טקסט הכפתור (אופציונלי, ברירת מחדל: "🌿 סדרו פרחים") */
  buttonLabel?: string;
  /** מרחק משמאל (אופציונלי, למניעת התנגשויות של כמה עורכים באותו עמוד) */
  buttonOffset?: number;
}) {
  const isDev = process.env.NODE_ENV === "development";
  const [mounted, setMounted] = useState(false);
  const [edit, setEdit] = useState(false);
  const [layout, setLayout] = useState<Deco[]>(DEFAULT_DECOR[variant] ?? []);
  const [sel, setSel] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const [availableAssets, setAvailableAssets] = useState<string[]>(BOTANICALS);

  useEffect(() => {
    if (isDev && editable) {
      fetch("/api/assets")
        .then((res) => res.json())
        .then((data) => {
          if (data.assets && data.assets.length > 0) {
            setAvailableAssets(data.assets);
          }
        })
        .catch(console.error);
    }
  }, [isDev, editable]);

  // טעינת פריסה שמורה (אם יש) לכל קבוצה
  useEffect(() => {
    setMounted(true);
    const saved = readAll()[variant] ?? [];
    setLayout(saved.length ? saved : DEFAULT_DECOR[variant] ?? []);
    setSel(null);
  }, [variant]);

  function save(next: Deco[]) {
    const all = readAll();
    all[variant] = next;
    try {
      localStorage.setItem(DECOR_STORAGE_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }

  function update(i: number, patch: Partial<Deco>, commit = true) {
    setLayout((prev) => {
      const next = prev.map((d, j) => (j === i ? { ...d, ...patch } : d));
      if (commit) save(next);
      return next;
    });
  }

  // גרירה
  const drag = useRef<number | null>(null);
  useEffect(() => {
    if (!edit) return;
    function move(e: PointerEvent) {
      const i = drag.current;
      if (i === null || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const x = clamp(((e.clientX - r.left) / r.width) * 100, -15, 115);
      const y = clamp(((e.clientY - r.top) / r.height) * 100, -15, 115);
      update(i, { x: Math.round(x), y: Math.round(y) }, false);
    }
    function up() {
      if (drag.current !== null) {
        drag.current = null;
        save(layoutRef.current);
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [edit]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = sel !== null ? layout[sel] : null;

  const renderItem = (d: Deco, i: number) => (
    <img
      key={i}
      src={d.src}
      alt=""
      draggable={false}
      onPointerDown={
        edit
          ? (e) => {
              e.preventDefault();
              setSel(i);
              drag.current = i;
            }
          : undefined
      }
      className="absolute select-none"
      style={{
        left: `${d.x}%`,
        top: `${d.y}%`,
        width: d.w,
        transform: `translate(-50%, -50%) rotate(${d.rot}deg)`,
        cursor: edit ? "move" : "default",
        outline: edit && sel === i ? "2px dashed var(--tw-ring-color, #9B5750)" : "none",
        outlineOffset: 4,
        pointerEvents: edit ? "auto" : "none",
        // שרכים (fern) היו פעם תמיד מתחת, אבל עכשיו ניתן לשלוט בסדר בעזרת הכפתורים
        zIndex: 2,
      }}
    />
  );

  return (
    <>
      {/* Foreground layer for all decorations (clipped to notebook boundaries, except on Landing page and global background) */}
      <div
        ref={containerRef}
        className={`absolute inset-0 rounded-xl ${variant === "Landing" || variant === "רקע ספרון" ? "" : "overflow-hidden"}`}
        style={{ pointerEvents: "none", zIndex: edit ? 40 : undefined }}
        aria-hidden
      >
        {layout.map((d, i) => renderItem(d, i))}
      </div>

      {/* כלי-עורך — מוצגים רק בפיתוח ורק לעותק שניתן לעריכה (לא לעותקי-הדפסה),
          מחוץ לאזור החיתוך (portal ל-body) */}
      {editable && isDev && mounted &&
        createPortal(
          <div style={{ position: "fixed", left: buttonOffset, bottom: 12, zIndex: 9999, fontFamily: "system-ui" }}>
            {!edit ? (
              <button
                type="button"
                onClick={() => setEdit(true)}
                style={btn}
              >
                {buttonLabel}
              </button>
            ) : (
              <div style={panel}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 13 }}>פרחים · {variant}</strong>
                  <button type="button" style={btnSm} onClick={() => setEdit(false)}>
                    סיום
                  </button>
                </div>

                {selected ? (
                  <>
                    <label style={row}>
                      גודל
                      <input
                        type="range"
                        min={60}
                        max={640}
                        value={selected.w}
                        onChange={(e) => update(sel!, { w: Number(e.target.value) })}
                      />
                      <span style={{ width: 38, textAlign: "left" }}>{selected.w}</span>
                    </label>
                    <label style={row}>
                      סיבוב
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={selected.rot}
                        onChange={(e) => update(sel!, { rot: Number(e.target.value) })}
                      />
                      <span style={{ width: 38, textAlign: "left" }}>{selected.rot}°</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        style={btnSm}
                        onClick={() => {
                          if (sel === null || sel === 0) return;
                          const next = [...layout];
                          const temp = next[sel];
                          next[sel] = next[sel - 1];
                          next[sel - 1] = temp;
                          setLayout(next);
                          save(next);
                          setSel(sel - 1);
                        }}
                      >
                        העבר אחורה
                      </button>
                      <button
                        type="button"
                        style={btnSm}
                        onClick={() => {
                          if (sel === null || sel === layout.length - 1) return;
                          const next = [...layout];
                          const temp = next[sel];
                          next[sel] = next[sel + 1];
                          next[sel + 1] = temp;
                          setLayout(next);
                          save(next);
                          setSel(sel + 1);
                        }}
                      >
                        העבר קדימה
                      </button>
                      <button
                        type="button"
                        style={btnSm}
                        onClick={() => {
                          const next = layout.filter((_, j) => j !== sel);
                          setLayout(next);
                          save(next);
                          setSel(null);
                        }}
                      >
                        מחיקה
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: "#666", margin: 0 }}>לחצי על פרח כדי לבחור ולערוך</p>
                )}

                <label style={row}>
                  הוסיפי
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const next = [...layout, { src: e.target.value, x: 50, y: 50, w: 220, rot: 0 }];
                      setLayout(next);
                      save(next);
                      setSel(next.length - 1);
                      e.target.value = "";
                    }}
                  >
                    <option value="">פרח…</option>
                    {availableAssets.map((s) => (
                      <option key={s} value={s}>
                        {s.split("/").pop()?.replace(".png", "")}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={btnSm}
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/save-decor", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...DEFAULT_DECOR, ...readAll() }),
                        });
                        if (res.ok) {
                          alert("הפריסה נשמרה לקוד בהצלחה! 🎉");
                        } else {
                          const err = await res.json();
                          alert("שגיאה בשמירה: " + (err.error || ""));
                        }
                      } catch (e: any) {
                        alert("שגיאה בשמירה: " + e.message);
                      }
                    }}
                  >
                    שמירה לקוד
                  </button>
                  <button
                    type="button"
                    style={btnSm}
                    onClick={() => {
                      const def = DEFAULT_DECOR[variant] ?? [];
                      setLayout(def);
                      save(def);
                      setSel(null);
                    }}
                  >
                    איפוס לעמוד זה
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

const btn: React.CSSProperties = {
  background: "#9B5750",
  color: "#fff",
  border: "none",
  borderRadius: 999,
  padding: "8px 16px",
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,.2)",
};

const panel: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e3d8c8",
  borderRadius: 12,
  padding: 12,
  width: 260,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  boxShadow: "0 6px 20px rgba(0,0,0,.18)",
  direction: "rtl",
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
};

const btnSm: React.CSSProperties = {
  background: "#f3ead9",
  color: "#3A2E26",
  border: "1px solid #d9c8b0",
  borderRadius: 8,
  padding: "5px 10px",
  fontSize: 12,
  cursor: "pointer",
};
