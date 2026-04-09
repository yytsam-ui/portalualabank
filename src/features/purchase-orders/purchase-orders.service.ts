import { ApprovalDecision, AuditAction, EntityType, PurchaseOrderStatus } from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { assertCondition, DomainError } from "@/lib/errors";
import { decimal, sumNumbers } from "@/lib/numbers";
import { canReadArea, type SessionActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  assertCanApprovePurchaseOrder,
  assertCanCreatePurchaseOrder,
  buildPurchaseOrderListWhere,
} from "@/features/purchase-orders/purchase-order-access";
import { notifyPurchaseOrderApproved, notifyPurchaseOrderCreated } from "@/features/notifications/notifications.service";
import { assertPurchaseOrderDecisionable, assertPurchaseOrderSubmittable } from "@/lib/workflow";

type CreatePurchaseOrderInput = {
  supplierId: string;
  area: string;
  accountCode: string;
  costCenter: string;
  requesterName?: string;
  currency: "ARS" | "USD";
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  intent: "save" | "approve";
};

function generatePurchaseOrderNumber(sequence: number) {
  return `PO-${String(sequence + 1).padStart(6, "0")}`;
}

export async function createPurchaseOrder(actor: SessionActor, input: CreatePurchaseOrderInput, files: File[]) {
  assertCanCreatePurchaseOrder(actor);

  const totalAmount = sumNumbers(input.items.map((item) => item.quantity * item.unitPrice));
  assertCondition(totalAmount > 0, "La OC debe tener un importe total mayor a cero.");
  assertCondition(input.accountCode.trim().length > 0, "La cuenta contable es obligatoria.");
  assertCondition(input.costCenter.trim().length > 0, "El CECO es obligatorio.");

  return prisma.$transaction(async (tx) => {
    const sequence = await tx.purchaseOrder.count({ where: { deletedAt: null } });
    const number = generatePurchaseOrderNumber(sequence);
    const status: PurchaseOrderStatus = input.intent === "approve" ? "APPROVED" : "DRAFT";

    const created = await tx.purchaseOrder.create({
      data: {
        number,
        supplierId: input.supplierId,
        area: input.area,
        accountCode: input.accountCode.trim(),
        costCenter: input.costCenter.trim(),
        requesterName: input.requesterName,
        createdById: actor.id,
        currency: input.currency,
        totalAmount: decimal(totalAmount),
        consumedAmount: decimal(0),
        remainingAmount: decimal(totalAmount),
        status,
        approvedById: input.intent === "approve" ? actor.id : null,
        approvedAt: input.intent === "approve" ? new Date() : null,
        notes: input.notes,
        items: {
          create: input.items.map((item) => {
            const totalPrice = item.quantity * item.unitPrice;
            return {
              description: item.description,
              quantity: decimal(item.quantity),
              unitPrice: decimal(item.unitPrice),
              totalPrice: decimal(totalPrice),
              consumedAmount: decimal(0),
              remainingAmount: decimal(totalPrice),
            };
          }),
        },
      },
    });

    await createAuditLog(tx, {
      entityType: EntityType.PURCHASE_ORDER,
      entityId: created.id,
      action: AuditAction.CREATED,
      performedById: actor.id,
      toStatus: status,
      metadata: { number, area: created.area, accountCode: created.accountCode, costCenter: created.costCenter },
    });
    await notifyPurchaseOrderCreated(tx, {
      purchaseOrderId: created.id,
      number: created.number,
      area: created.area,
      createdById: actor.id,
    });

    if (status === "APPROVED") {
      await createAuditLog(tx, {
        entityType: EntityType.PURCHASE_ORDER,
        entityId: created.id,
        action: AuditAction.APPROVED,
        performedById: actor.id,
        fromStatus: "DRAFT",
        toStatus: "APPROVED",
        comment: "OC aprobada por Compras al momento de crearla.",
      });
      await notifyPurchaseOrderApproved(tx, {
        purchaseOrderId: created.id,
        number: created.number,
        area: created.area,
        createdById: actor.id,
      });
    }

    for (const file of files) {
      if (!file.name) continue;
      const { saveUploadedFile } = await import("@/lib/storage");
      const stored = await saveUploadedFile(file);
      await tx.attachment.create({
        data: {
          entityType: EntityType.PURCHASE_ORDER,
          entityId: created.id,
          fileName: stored.fileName,
          filePath: stored.filePath,
          mimeType: stored.mimeType,
          uploadedById: actor.id,
        },
      });
      await createAuditLog(tx, {
        entityType: EntityType.PURCHASE_ORDER,
        entityId: created.id,
        action: AuditAction.ATTACHMENT_ADDED,
        performedById: actor.id,
        comment: stored.fileName,
      });
    }

    return created;
  });
}

export async function approvePurchaseOrder(actor: SessionActor, purchaseOrderId: string) {
  assertCanApprovePurchaseOrder(actor);

  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
    if (!po || po.deletedAt) {
      throw new DomainError("La OC no existe.", "NOT_FOUND", 404);
    }

    assertPurchaseOrderSubmittable(po.status);
    assertPurchaseOrderDecisionable(po.status);
    assertCondition(po.createdById === actor.id || po.area === actor.area, "No podes aprobar una OC fuera de tu ambito.", "FORBIDDEN", 403);

    const updated = await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: "APPROVED",
        approvedById: actor.id,
        approvedAt: new Date(),
      },
    });

    await tx.approval.create({
      data: {
        entityType: EntityType.PURCHASE_ORDER,
        entityId: purchaseOrderId,
        step: 1,
        decision: ApprovalDecision.APPROVED,
        decidedById: actor.id,
        comment: "OC aprobada por Compras.",
      },
    });

    await createAuditLog(tx, {
      entityType: EntityType.PURCHASE_ORDER,
      entityId: purchaseOrderId,
      action: AuditAction.APPROVED,
      performedById: actor.id,
      fromStatus: po.status,
      toStatus: "APPROVED",
      comment: "OC aprobada por Compras.",
    });
    await notifyPurchaseOrderApproved(tx, {
      purchaseOrderId,
      number: updated.number,
      area: updated.area,
      createdById: actor.id,
    });

    return updated;
  });
}

export async function getPurchaseOrderDetail(actor: SessionActor, purchaseOrderId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: {
      supplier: true,
      createdBy: true,
      approvedBy: true,
      items: true,
      invoices: {
        where: { deletedAt: null },
        include: {
          allocations: true,
        },
      },
    },
  });

  if (!po || po.deletedAt) {
    throw new DomainError("La OC no existe.", "NOT_FOUND", 404);
  }

  const canRead =
    actor.role === "ADMIN" ||
    (actor.role === "PROCUREMENT" && actor.area === po.area) ||
    (actor.role === "REQUESTER_AREA" && canReadArea(actor, po.area)) ||
    (actor.role === "AP" &&
      po.invoices.some((invoice) => ["DERIVED_TO_AP", "RETURNED_BY_AP", "ACCOUNTED"].includes(invoice.status)));

  assertCondition(canRead, "No tenes permisos para ver esta OC.", "FORBIDDEN", 403);

  const [attachments, approvals, auditLogs] = await Promise.all([
    prisma.attachment.findMany({
      where: { entityType: EntityType.PURCHASE_ORDER, entityId: purchaseOrderId },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.approval.findMany({
      where: { entityType: EntityType.PURCHASE_ORDER, entityId: purchaseOrderId },
      include: { decidedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { entityType: EntityType.PURCHASE_ORDER, entityId: purchaseOrderId },
      include: { performedBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { ...po, attachments, approvals, auditLogs };
}

export async function listPurchaseOrders(actor: SessionActor) {
  return prisma.purchaseOrder.findMany({
    where: buildPurchaseOrderListWhere(actor),
    include: {
      supplier: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function validatePoTransition(current: PurchaseOrderStatus, next: PurchaseOrderStatus) {
  if (current === next) {
    return;
  }

  const allowedTransitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    DRAFT: ["APPROVED", "CANCELED"],
    APPROVED: ["PARTIALLY_CONSUMED", "FULLY_CONSUMED", "CLOSED", "CANCELED"],
    PARTIALLY_CONSUMED: ["FULLY_CONSUMED", "CLOSED", "CANCELED"],
    FULLY_CONSUMED: ["CLOSED"],
    CLOSED: [],
    CANCELED: [],
  };

  assertCondition(
    allowedTransitions[current].includes(next),
    `Transicion invalida de OC: ${current} -> ${next}.`,
    "INVALID_PO_TRANSITION",
  );
}

export function computePurchaseOrderConsumption(input: {
  remainingAmount: number;
  consumedAmount: number;
  invoiceAmount: number;
}) {
  assertCondition(
    input.invoiceAmount <= input.remainingAmount,
    `La factura supera el saldo disponible de la OC. Saldo disponible: ${input.remainingAmount.toFixed(2)}.`,
    "PO_BALANCE_EXCEEDED",
  );

  const consumedAmount = input.consumedAmount + input.invoiceAmount;
  const remainingAmount = input.remainingAmount - input.invoiceAmount;
  const nextStatus: PurchaseOrderStatus =
    remainingAmount === 0 ? "FULLY_CONSUMED" : consumedAmount > 0 ? "PARTIALLY_CONSUMED" : "APPROVED";

  return {
    consumedAmount,
    remainingAmount,
    nextStatus,
  };
}
