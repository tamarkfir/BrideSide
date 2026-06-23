import { UI_TEXT } from "@/lib/prompts";

type AIMessageProps = {
  text?: string;
  loading?: boolean;
  /** גרסה צפופה לעמודי הספר — פחות ריווח, טקסט קטן יותר */
  compact?: boolean;
  children?: React.ReactNode;
};

export default function AIMessage({ text, loading, compact, children }: AIMessageProps) {
  return (
    <div className={`note-card animate-fade-in ${compact ? "" : "py-5"}`}>
      <p className={`script-accent ${compact ? "mb-1 text-base" : "mb-1.5 text-lg"}`}>
{UI_TEXT.facilitatorLabel}
      </p>
      {loading ? (
        <div className="flex gap-1.5 py-1" aria-label="המנחה כותבת...">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-sand" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-sand [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-sand [animation-delay:300ms]" />
        </div>
      ) : (
        <>
          {text && (
            <p className={`whitespace-pre-line leading-relaxed ${compact ? "text-base" : "text-lg"}`}>
              {text}
            </p>
          )}
          {children}
        </>
      )}
    </div>
  );
}
