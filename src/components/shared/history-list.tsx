import { formatDate, formatStatusLabel } from "@/lib/utils";

export function HistoryList({
  items,
}: {
  items: Array<{
    id: string;
    action: string;
    createdAt: Date;
    comment?: string | null;
    performedBy?: { name: string } | null;
  }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{formatStatusLabel(item.action)}</p>
              <p className="text-xs text-slate-500">
                {item.performedBy?.name ? `${item.performedBy.name} · ` : ""}
                {formatDate(item.createdAt)}
              </p>
            </div>
          </div>
          {item.comment ? <p className="mt-2 text-sm text-slate-600">{item.comment}</p> : null}
        </div>
      ))}
    </div>
  );
}
