import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/guards";
import { isPreviewableMimeType } from "@/lib/utils";
import { getAttachmentDetail } from "@/features/attachments/attachments.service";

export default async function AttachmentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  const attachment = await getAttachmentDetail(user, id).catch(() => null);

  if (!attachment) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Adjuntos"
        title={attachment.fileName}
        description="Vista segura del archivo adjunto."
        actions={
          <a href={`/api/attachments/${attachment.id}?descarga=1`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900">
            Descargar archivo
          </a>
        }
      />
      <Card>
        <CardContent className="p-4">
          {attachment.mimeType === "application/pdf" ? (
            <iframe title={attachment.fileName} src={`/api/attachments/${attachment.id}`} className="h-[75vh] w-full rounded-2xl border border-slate-200" />
          ) : attachment.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/attachments/${attachment.id}`} alt={attachment.fileName} className="max-h-[75vh] w-full rounded-2xl object-contain" />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm text-slate-600">
                Este formato no tiene vista embebida. {isPreviewableMimeType(attachment.mimeType) ? "Podes abrirlo desde el navegador." : "Descargalo para revisarlo."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
