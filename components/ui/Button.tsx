type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
}: ButtonProps) {
  const base =
    "rounded-full px-8 py-3 text-base transition duration-300 disabled:cursor-not-allowed disabled:opacity-40";
  const styles =
    variant === "primary"
      ? "bg-brand-rose text-white shadow-sm hover:bg-brand-roseDark"
      : "border border-brand-rose/40 text-brand-roseDark hover:border-brand-rose hover:bg-brand-rose/5";

  return (
    <button type={type} className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
