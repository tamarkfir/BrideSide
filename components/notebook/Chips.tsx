"use client";

type ChipsProps = {
  items: string[];
  onPick: (value: string) => void;
  isActive?: (value: string) => boolean;
};

/** הצעות מהירות ללחיצה — מתחת לכל שאלה. עיצוב כמו תגיות נייר. */
export default function Chips({ items, onPick, isActive }: ChipsProps) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {items.map((item) => {
        const active = isActive?.(item) ?? false;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onPick(item)}
            className={`chip-organic px-4 py-2 text-sm ${active ? "active" : ""}`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
