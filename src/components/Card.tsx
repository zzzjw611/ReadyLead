import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-card-border bg-card/90 p-6 shadow-2xl shadow-black/20",
        className,
      )}
    >
      {children}
    </section>
  );
}
