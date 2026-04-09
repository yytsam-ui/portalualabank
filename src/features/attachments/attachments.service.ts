import { EntityType } from "@prisma/client";

import { assertCondition, DomainError } from "@/lib/errors";
import { type SessionActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function getAttachmentDetail(actor: SessionActor, attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    throw new DomainError("Adjunto no encontrado.", "NOT_FOUND", 404);
  }

  if (attachment.entityType === EntityType.PURCHASE_ORDER) {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: attachment.entityId },
      include: { invoices: true },
    });

    if (!purchaseOrder || purchaseOrder.deletedAt) {
      throw new DomainError("La orden de compra asociada no existe.", "NOT_FOUND", 404);
    }

    const canRead =
      actor.role === "ADMIN" ||
      (actor.role === "PROCUREMENT" && actor.area === purchaseOrder.area) ||
      (actor.role === "REQUESTER_AREA" && actor.area === purchaseOrder.area) ||
      (actor.role === "AP" &&
        purchaseOrder.invoices.some((invoice) => ["DERIVED_TO_AP", "RETURNED_BY_AP", "ACCOUNTED"].includes(invoice.status)));

    assertCondition(canRead, "No tenes permisos para ver este adjunto.", "FORBIDDEN", 403);
  }

  if (attachment.entityType === EntityType.INVOICE) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: attachment.entityId },
      include: { purchaseOrder: true },
    });

    if (!invoice || invoice.deletedAt) {
      throw new DomainError("La factura asociada no existe.", "NOT_FOUND", 404);
    }

    const canRead =
      actor.role === "ADMIN" ||
      (actor.role === "REQUESTER_AREA" && (invoice.areaAssigned === actor.area || invoice.purchaseOrder?.area === actor.area)) ||
      (actor.role === "AP" && ["DRAFT", "PENDING_AREA_APPROVAL", "DERIVED_TO_AP", "RETURNED_BY_AP", "ACCOUNTED"].includes(invoice.status));

    assertCondition(canRead, "No tenes permisos para ver este adjunto.", "FORBIDDEN", 403);
  }

  return attachment;
}
