import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-card)] shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--color-border-soft)] px-6 py-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}
