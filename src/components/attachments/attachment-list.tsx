import Link from "next/link";

import { isPreviewableMimeType } from "@/lib/utils";

export function AttachmentList({
  attachments,
}: {
  attachments: Array<{ id: string; fileName: string; mimeType: string }>;
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-500">No hay adjuntos cargados.</p>;
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">{attachment.fileName}</p>
          <p className="mt-1 text-xs text-slate-500">{attachment.mimeType}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href={`/adjuntos/${attachment.id}`} className="font-semibold text-slate-950">
              {isPreviewableMimeType(attachment.mimeType) ? "Ver adjunto" : "Ver detalle"}
            </Link>
            <a href={`/api/attachments/${attachment.id}?descarga=1`} className="text-slate-600 hover:text-slate-900">
              Descargar
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
