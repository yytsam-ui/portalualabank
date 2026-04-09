import Link from "next/link";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/ap/monitor-de-facturas", label: "Monitor de facturas" },
  { href: "/ap/cargar-factura", label: "Cargar factura" },
  { href: "/ap/inbox", label: "Bandeja AP" },
];

export function ApTabs({ currentPath }: { currentPath: string }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-[color:var(--color-border-soft)] bg-white p-2 shadow-sm">
      {tabs.map((tab) => {
        const active = currentPath === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              active
                ? "bg-[color:var(--color-brand-primary)] text-white shadow-sm"
                : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-surface)] hover:text-[color:var(--color-brand-primary)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
