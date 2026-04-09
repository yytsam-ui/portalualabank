import { InvoiceStatus, PurchaseOrderStatus } from "@prisma/client";

import { cn } from "@/lib/utils";
import { formatStatusLabel } from "@/lib/utils";

const classes: Record<string, string> = {
  DRAFT: "bg-[color:var(--color-brand-surface)] text-[color:var(--color-brand-primary)]",
  PENDING_AREA_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  DERIVED_TO_AP: "bg-cyan-100 text-cyan-800",
  ACCOUNTED: "bg-emerald-100 text-emerald-800",
  REJECTED_BY_AREA: "bg-rose-100 text-rose-700",
  RETURNED_BY_AP: "bg-rose-100 text-rose-700",
  CANCELED: "bg-rose-100 text-rose-700",
  PARTIALLY_CONSUMED: "bg-violet-100 text-violet-800",
  FULLY_CONSUMED: "bg-[color:var(--color-text-primary)] text-white",
  CLOSED: "bg-[color:var(--color-text-primary)] text-white",
  CREATED: "bg-[color:var(--color-brand-surface)] text-[color:var(--color-brand-primary)]",
  APPROVED_ACTION: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700",
  RETURNED: "bg-rose-100 text-rose-700",
  DERIVED: "bg-cyan-100 text-cyan-800",
  ACCOUNTED_ACTION: "bg-emerald-100 text-emerald-800",
  NOTIFICATION_QUEUED: "bg-[color:var(--color-brand-surface)] text-[color:var(--color-brand-primary)]",
};

export function StatusBadge({ status }: { status: PurchaseOrderStatus | InvoiceStatus | string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", classes[status] ?? classes.DRAFT)}>
      {formatStatusLabel(status)}
    </span>
  );
}
