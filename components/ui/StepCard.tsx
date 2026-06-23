type StepCardProps = {
  title?: string;
  children: React.ReactNode;
};

export default function StepCard({ title, children }: StepCardProps) {
  return (
    <section className="animate-fade-in-up space-y-4 rounded-2xl bg-brand-cream p-6 shadow-sm">
      {title && <h2 className="text-xl text-brand-roseDark">{title}</h2>}
      {children}
    </section>
  );
}
