type OutputCardProps = {
  title: string;
  children: React.ReactNode;
};

/** כרטיס הפלט שנוצר בסוף כל שלב */
export default function OutputCard({ title, children }: OutputCardProps) {
  return (
    <section className="animate-fade-in-up space-y-4 rounded-2xl border border-brand-rose/20 bg-white/60 p-8 shadow-sm">
      <h2 className="text-center text-xl text-brand-roseDark">{title}</h2>
      {children}
    </section>
  );
}
