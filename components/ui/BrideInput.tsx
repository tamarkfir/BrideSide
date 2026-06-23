import AutoTextarea from "./AutoTextarea";

type BrideInputProps = {
  brideName: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
};

export default function BrideInput({
  brideName,
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 4,
}: BrideInputProps) {
  const inputClass =
    "w-full field-paper px-5 py-4 text-base outline-none placeholder:text-brand-sand/80";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-lg text-brand-roseDark">{brideName}</span>
        {label && <span className="text-sm text-brand-sand">{label}</span>}
      </div>
      {multiline ? (
        <AutoTextarea
          className={`${inputClass} leading-relaxed`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minRows={rows}
        />
      ) : (
        <input
          type="text"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
