"use client";

import { useLayoutEffect, useRef } from "react";

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows" | "style"> & {
  value: string;
  /** גובה מינימלי בשורות — התיבה גדלה מעבר לזה לפי התוכן */
  minRows?: number;
};

/**
 * תיבת טקסט שגדלה לגובה התוכן — מתחילה קטנה וגדלה ככל שכותבים,
 * בלי גלילה פנימית ובלי ידית גרירה. מתאימה לכתיבה חופשית בכל אורך.
 */
export default function AutoTextarea({ value, minRows = 1, className = "", ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // מתאים גובה בכל שינוי תוכן, וגם כשרוחב החלון משתנה (גלישת שורות)
  useLayoutEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      onInput={resize}
      style={{ minHeight: `calc(${minRows} * 1.7em + 1.5rem)` }}
      className={`resize-none overflow-hidden ${className}`}
      {...rest}
    />
  );
}
