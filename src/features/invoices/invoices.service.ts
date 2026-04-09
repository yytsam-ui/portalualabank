import { AuditAction, EntityType, InvoiceSourceType, InvoiceStatus, InvoiceType, Prisma } from "@prisma/client";

import { assertInvoiceIsNotDuplicate, assertInvoiceWithinPoBalance } from "@/features/invoices/invoice-rules";
import {
  assertCanApOperateInvoice,
  assertCanAssignMonitorInvoice,
  assertCanCreateInvoice,
  assertCanCreateMonitorInvoice,
  assertCanSendInvoiceToAp,
  buildInvoiceListWhere,
  canApSeeInvoiceStatus,
} from "@/features/invoices/invoice-access";
import {
  notifyInvoiceAccounted,
  notifyInvoiceDerivedToArea,
  notifyInvoiceReturnedByAp,
  notifyInvoiceSentToAp,
} from "@/features/notifications/notifications.service";
import { assertCommentRequired } from "@/features/shared/decision";
import { createAuditLog } from "@/lib/audit";
import { assertCondition, DomainError } from "@/lib/errors";
import { decimal, decimalToNumber } from "@/lib/numbers";
import { canManageAreaInvoices, type SessionActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertInvoiceApProcessable, assertInvoiceAreaDecisionable, assertPurchaseOrderEligibleForInvoice } from "@/lib/workflow";
import { computePurchaseOrderConsumption, validatePoTransition } from "@/features/purchase-orders/purchase-orders.service";

type CreateInvoiceInput = {
  purchaseOrderId: string;
  invoiceNumber: string;
  notes?: string;
};

type CreateMonitorInvoiceInput = {
  supplierId: string;
  invoiceNumber?: string;
  areaAssigned?: string;
  receivedDate: string;
  notes?: string;
};

type AssignMonitorInvoiceInput = {
  areaAssigned: string;
};

type SendInvoiceToApInput = {
  purchaseOrderId: string;
  invoiceNumber: string;
  notes?: string;
};

type AccountInvoiceInput = {
  invoiceType: InvoiceType;
  invoiceDate: string;
  currency: "ARS" | "USD";
  subtotal: number;
  taxes: number;
  totalAmount: number;
  accountCode: string;
  costCenter: string;
  notes?: string;
};

async function persistAttachments(
  tx: Prisma.TransactionClient,
  entityId: string,
  actorId: string,
  files: File[],
) {
  for (const file of files) {
    if (!file.name) continue;
    const { saveUploadedFile } = await import("@/lib/storage");
    const stored = await saveUploadedFile(file);
    await tx.attachment.create({
      data: {
        entityType: EntityType.INVOICE,
        entityId,
        fileName: stored.fileName,
        filePath: stored.filePath,
        mimeType: stored.mimeType,
        uploadedById: actorId,
      },
    });
    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId,
      action: AuditAction.ATTACHMENT_ADDED,
      performedById: actorId,
      comment: stored.fileName,
    });
  }
}

export async function createInvoice(actor: SessionActor, input: CreateInvoiceInput, files: File[]) {
  assertCanCreateInvoice(actor);

  return prisma.$transaction(async (tx) => {
    const purchaseOrder = await tx.purchaseOrder.findUnique({
      where: { id: input.purchaseOrderId },
    });

    if (!purchaseOrder || purchaseOrder.deletedAt) {
      throw new DomainError("La orden de compra no existe.", "NOT_FOUND", 404);
    }

    assertCondition(canManageAreaInvoices(actor, purchaseOrder.area), "Solo podes cargar facturas sobre OCs de tu area.", "FORBIDDEN", 403);
    assertPurchaseOrderEligibleForInvoice(purchaseOrder.status);

    const created = await tx.invoice.create({
      data: {
        supplierId: purchaseOrder.supplierId,
        purchaseOrderId: purchaseOrder.id,
        areaAssigned: purchaseOrder.area,
        sourceType: InvoiceSourceType.AREA,
        invoiceNumber: input.invoiceNumber.trim(),
        receivedDate: new Date(),
        status: "DERIVED_TO_AP",
        uploadedById: actor.id,
        approvedByUserAreaId: actor.id,
        approvedByUserAreaAt: new Date(),
        notes: input.notes,
      },
    });

    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId: created.id,
      action: AuditAction.CREATED,
      performedById: actor.id,
      toStatus: "DERIVED_TO_AP",
      comment: "Factura cargada desde una orden de compra y enviada a AP.",
      metadata: { purchaseOrderId: purchaseOrder.id, invoiceNumber: created.invoiceNumber },
    });

    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId: created.id,
      action: AuditAction.DERIVED,
      performedById: actor.id,
      fromStatus: "DRAFT",
      toStatus: "DERIVED_TO_AP",
      comment: "Factura aprobada por el area y enviada a AP en un solo paso.",
    });
    await notifyInvoiceSentToAp(tx, {
      invoiceId: created.id,
      invoiceNumber: created.invoiceNumber,
      createdById: actor.id,
    });

    await persistAttachments(tx, created.id, actor.id, files);

    return created;
  });
}

export async function createMonitorInvoice(actor: SessionActor, input: CreateMonitorInvoiceInput, files: File[]) {
  assertCanCreateMonitorInvoice(actor);

  return prisma.$transaction(async (tx) => {
    const status: InvoiceStatus = input.areaAssigned?.trim() ? "PENDING_AREA_APPROVAL" : "DRAFT";
    const created = await tx.invoice.create({
      data: {
        supplierId: input.supplierId,
        areaAssigned: input.areaAssigned?.trim() || null,
        sourceType: InvoiceSourceType.AP_MONITOR,
        invoiceNumber: input.invoiceNumber?.trim() || null,
        receivedDate: new Date(input.receivedDate),
        status,
        uploadedById: actor.id,
        notes: input.notes,
      },
    });

    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId: created.id,
      action: AuditAction.CREATED,
      performedById: actor.id,
      toStatus: status,
      comment: "Factura cargada en el monitor de AP.",
      metadata: { sourceType: created.sourceType, areaAssigned: created.areaAssigned },
    });

    if (status === "PENDING_AREA_APPROVAL") {
      await createAuditLog(tx, {
        entityType: EntityType.INVOICE,
        entityId: created.id,
        action: AuditAction.DERIVED,
        performedById: actor.id,
        fromStatus: "DRAFT",
        toStatus: "PENDING_AREA_APPROVAL",
        comment: `Factura derivada al area ${created.areaAssigned}.`,
      });
      await notifyInvoiceDerivedToArea(tx, {
        invoiceId: created.id,
        area: created.areaAssigned!,
        invoiceNumber: created.invoiceNumber,
        createdById: actor.id,
      });
    }

    await persistAttachments(tx, created.id, actor.id, files);

    return created;
  });
}

export async function assignMonitorInvoiceToArea(actor: SessionActor, invoiceId: string, input: AssignMonitorInvoiceInput) {
  assertCanAssignMonitorInvoice(actor);

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.deletedAt) {
      throw new DomainError("La factura no existe.", "NOT_FOUND", 404);
    }

    assertCondition(invoice.sourceType === "AP_MONITOR", "Solo las facturas del monitor pueden derivarse a un area.", "INVALID_INVOICE_SOURCE");
    assertCondition(invoice.status === "DRAFT", "La factura ya fue derivada o procesada.", "INVALID_INVOICE_TRANSITION");

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        areaAssigned: input.areaAssigned.trim(),
        status: "PENDING_AREA_APPROVAL",
      },
    });

    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId: invoiceId,
      action: AuditAction.DERIVED,
      performedById: actor.id,
      fromStatus: invoice.status,
      toStatus: "PENDING_AREA_APPROVAL",
      comment: `Factura derivada al area ${updated.areaAssigned}.`,
    });
    await notifyInvoiceDerivedToArea(tx, {
      invoiceId,
      area: updated.areaAssigned!,
      invoiceNumber: updated.invoiceNumber,
      createdById: actor.id,
    });

    return updated;
  });
}

export async function sendInvoiceToAp(actor: SessionActor, invoiceId: string, input: SendInvoiceToApInput, files: File[]) {
  assertCanSendInvoiceToAp(actor);

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.deletedAt) {
      throw new DomainError("La factura no existe.", "NOT_FOUND", 404);
    }

    assertInvoiceAreaDecisionable(invoice.status);
    assertCondition(invoice.areaAssigned === actor.area, "No podes operar facturas derivadas a otra area.", "FORBIDDEN", 403);

    const purchaseOrder = await tx.purchaseOrder.findUnique({ where: { id: input.purchaseOrderId } });
    if (!purchaseOrder || purchaseOrder.deletedAt) {
      throw new DomainError("La orden de compra no existe.", "NOT_FOUND", 404);
    }

    assertCondition(purchaseOrder.area === actor.area, "Solo podes vincular la factura a una OC de tu area.", "FORBIDDEN", 403);
    assertCondition(purchaseOrder.supplierId === invoice.supplierId, "El proveedor de la factura debe coincidir con el proveedor de la OC.", "SUPPLIER_MISMATCH");
    assertPurchaseOrderEligibleForInvoice(purchaseOrder.status);

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        purchaseOrderId: purchaseOrder.id,
        invoiceNumber: input.invoiceNumber.trim(),
        approvedByUserAreaId: actor.id,
        approvedByUserAreaAt: new Date(),
        status: "DERIVED_TO_AP",
        notes: input.notes ?? invoice.notes,
      },
    });

    await tx.approval.create({
      data: {
        entityType: EntityType.INVOICE,
        entityId: invoiceId,
        step: 1,
        decision: "APPROVED",
        decidedById: actor.id,
        comment: "Factura vinculada a OC y enviada a AP.",
      },
    });

    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId: invoiceId,
      action: AuditAction.UPDATED,
      performedById: actor.id,
      comment: "Factura vinculada a una orden de compra por el area.",
      metadata: { purchaseOrderId: purchaseOrder.id, invoiceNumber: updated.invoiceNumber },
    });

    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId: invoiceId,
      action: AuditAction.DERIVED,
      performedById: actor.id,
      fromStatus: invoice.status,
      toStatus: "DERIVED_TO_AP",
      comment: "Factura aprobada por el area y enviada a AP.",
    });
    await notifyInvoiceSentToAp(tx, {
      invoiceId,
      invoiceNumber: updated.invoiceNumber,
      createdById: actor.id,
    });

    await persistAttachments(tx, updated.id, actor.id, files);

    return updated;
  });
}

export async function returnInvoiceByAp(actor: SessionActor, invoiceId: string, comment: string) {
  assertCanApOperateInvoice(actor);
  assertCommentRequired("RETURNED", comment);

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        purchaseOrder: true,
      },
    });
    if (!invoice || invoice.deletedAt) {
      throw new DomainError("La factura no existe.", "NOT_FOUND", 404);
    }

    assertInvoiceApProcessable(invoice.status);

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "RETURNED_BY_AP" },
    });

    await tx.approval.create({
      data: {
        entityType: EntityType.INVOICE,
        entityId: invoiceId,
        step: 2,
        decision: "RETURNED",
        decidedById: actor.id,
        comment,
      },
    });

    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId: invoiceId,
      action: AuditAction.RETURNED,
      performedById: actor.id,
      fromStatus: invoice.status,
      toStatus: "RETURNED_BY_AP",
      comment,
    });
    await notifyInvoiceReturnedByAp(tx, {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      area: invoice.areaAssigned ?? invoice.purchaseOrder?.area ?? null,
      createdById: actor.id,
      comment,
    });

    return updated;
  });
}

export async function accountInvoice(actor: SessionActor, invoiceId: string, input: AccountInvoiceInput) {
  assertCanApOperateInvoice(actor);

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        purchaseOrder: {
          include: {
            items: true,
          },
        },
      },
    });
    if (!invoice || invoice.deletedAt) {
      throw new DomainError("La factura no existe.", "NOT_FOUND", 404);
    }

    assertInvoiceApProcessable(invoice.status);
    assertCondition(!!invoice.purchaseOrder, "La factura todavia no esta vinculada a una orden de compra.", "PURCHASE_ORDER_REQUIRED");
    assertCondition(!!invoice.invoiceNumber?.trim(), "La factura debe tener numero antes de contabilizarse.", "INVOICE_NUMBER_REQUIRED");

    const duplicate = await tx.invoice.findFirst({
      where: {
        id: { not: invoice.id },
        deletedAt: null,
        supplierId: invoice.supplierId,
        invoiceType: input.invoiceType,
        invoiceNumber: invoice.invoiceNumber,
      },
    });
    assertInvoiceIsNotDuplicate(!!duplicate);

    const purchaseOrder = invoice.purchaseOrder;
    assertCondition(input.accountCode.trim().length > 0, "La cuenta contable es obligatoria.");
    assertCondition(input.costCenter.trim().length > 0, "El CECO es obligatorio.");
    assertInvoiceWithinPoBalance(input.totalAmount, decimalToNumber(purchaseOrder.remainingAmount));

    const poAmounts = computePurchaseOrderConsumption({
      remainingAmount: decimalToNumber(purchaseOrder.remainingAmount),
      consumedAmount: decimalToNumber(purchaseOrder.consumedAmount),
      invoiceAmount: input.totalAmount,
    });

    validatePoTransition(purchaseOrder.status, poAmounts.nextStatus);

    const accounted = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        invoiceType: input.invoiceType,
        invoiceDate: new Date(input.invoiceDate),
        currency: input.currency,
        subtotal: decimal(input.subtotal),
        taxes: decimal(input.taxes),
        totalAmount: decimal(input.totalAmount),
        accountCode: input.accountCode.trim(),
        costCenter: input.costCenter.trim(),
        notes: input.notes ?? invoice.notes,
        status: "ACCOUNTED",
        accountedById: actor.id,
        accountedAt: new Date(),
        allocations: {
          deleteMany: {},
          create: {
            purchaseOrderId: purchaseOrder.id,
            allocatedAmount: decimal(input.totalAmount),
          },
        },
      },
    });

    await tx.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: {
        status: poAmounts.nextStatus,
        consumedAmount: decimal(poAmounts.consumedAmount),
        remainingAmount: decimal(poAmounts.remainingAmount),
      },
    });

    await createAuditLog(tx, {
      entityType: EntityType.INVOICE,
      entityId: invoiceId,
      action: AuditAction.ACCOUNTED,
      performedById: actor.id,
      fromStatus: invoice.status,
      toStatus: "ACCOUNTED",
      comment: "Factura contabilizada por AP.",
      metadata: { accountCode: input.accountCode, costCenter: input.costCenter, totalAmount: input.totalAmount },
    });

    await createAuditLog(tx, {
      entityType: EntityType.PURCHASE_ORDER,
      entityId: purchaseOrder.id,
      action: AuditAction.STATUS_CHANGED,
      performedById: actor.id,
      fromStatus: purchaseOrder.status,
      toStatus: poAmounts.nextStatus,
      comment:
        purchaseOrder.status === poAmounts.nextStatus
          ? "La factura se contabilizo y la OC mantuvo el mismo estado."
          : "La factura se contabilizo y la OC actualizo su estado.",
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: input.totalAmount,
        noOpStatus: purchaseOrder.status === poAmounts.nextStatus,
      },
    });
    await notifyInvoiceAccounted(tx, {
      invoiceId,
      invoiceNumber: accounted.invoiceNumber,
      area: purchaseOrder.area,
      createdById: actor.id,
    });

    return accounted;
  });
}

export async function getInvoiceDetail(actor: SessionActor, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      supplier: true,
      purchaseOrder: {
        include: {
          supplier: true,
          items: true,
        },
      },
      uploadedBy: true,
      approvedByUserArea: true,
      accountedBy: true,
      allocations: {
        include: {
          purchaseOrderItem: true,
        },
      },
    },
  });

  if (!invoice || invoice.deletedAt) {
    throw new DomainError("La factura no existe.", "NOT_FOUND", 404);
  }

  const canRead =
    actor.role === "ADMIN" ||
    (actor.role === "REQUESTER_AREA" &&
      ((invoice.areaAssigned === actor.area) || (invoice.purchaseOrder?.area === actor.area))) ||
    (actor.role === "AP" && canApSeeInvoiceStatus(invoice.status));

  assertCondition(canRead, "No tenes permisos para ver esta factura.", "FORBIDDEN", 403);

  const [attachments, approvals, auditLogs] = await Promise.all([
    prisma.attachment.findMany({
      where: { entityType: EntityType.INVOICE, entityId: invoiceId },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.approval.findMany({
      where: { entityType: EntityType.INVOICE, entityId: invoiceId },
      include: { decidedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { entityType: EntityType.INVOICE, entityId: invoiceId },
      include: { performedBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { ...invoice, attachments, approvals, auditLogs };
}

export async function listInvoices(actor: SessionActor) {
  return prisma.invoice.findMany({
    where: buildInvoiceListWhere(actor),
    include: {
      supplier: true,
      purchaseOrder: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listMonitorInvoices(actor: SessionActor) {
  assertCanCreateMonitorInvoice(actor);

  return prisma.invoice.findMany({
    where: {
      deletedAt: null,
      sourceType: "AP_MONITOR",
    },
    include: {
      supplier: true,
      purchaseOrder: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function validateInvoiceTransition(current: InvoiceStatus, next: InvoiceStatus) {
  const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ["PENDING_AREA_APPROVAL", "CANCELED"],
    PENDING_AREA_APPROVAL: ["DERIVED_TO_AP", "REJECTED_BY_AREA", "CANCELED"],
    REJECTED_BY_AREA: ["CANCELED"],
    DERIVED_TO_AP: ["RETURNED_BY_AP", "ACCOUNTED"],
    RETURNED_BY_AP: ["DERIVED_TO_AP", "CANCELED"],
    ACCOUNTED: [],
    CANCELED: [],
  };

  assertCondition(
    allowedTransitions[current].includes(next),
    `Transicion invalida de factura: ${current} -> ${next}.`,
    "INVALID_INVOICE_TRANSITION",
  );
}
