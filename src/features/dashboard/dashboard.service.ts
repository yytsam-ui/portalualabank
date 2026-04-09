import { InvoiceStatus, PurchaseOrderStatus } from "@prisma/client";

import { type SessionActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics(actor: SessionActor) {
  const purchaseOrdersBase =
    actor.role === "PROCUREMENT" || actor.role === "REQUESTER_AREA" ? { area: actor.area } : {};

  const invoicesBase =
    actor.role === "REQUESTER_AREA"
      ? {
          OR: [{ areaAssigned: actor.area }, { purchaseOrder: { area: actor.area } }],
        }
      : actor.role === "AP"
        ? {
            status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.PENDING_AREA_APPROVAL, InvoiceStatus.DERIVED_TO_AP, InvoiceStatus.ACCOUNTED, InvoiceStatus.RETURNED_BY_AP] },
          }
        : actor.role === "PROCUREMENT"
          ? { id: "__no_results__" }
          : {};

  const [pendingPurchaseOrders, pendingInvoices, purchaseOrdersWithBalance, invoicesForAccounting, recentRejections] = await Promise.all([
    prisma.purchaseOrder.count({
      where: {
        deletedAt: null,
        status: PurchaseOrderStatus.DRAFT,
        ...purchaseOrdersBase,
      },
    }),
    prisma.invoice.count({
      where: {
        deletedAt: null,
        status: InvoiceStatus.PENDING_AREA_APPROVAL,
        ...invoicesBase,
      },
    }),
    prisma.purchaseOrder.count({
      where: {
        deletedAt: null,
        remainingAmount: { gt: 0 },
        status: { in: [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PARTIALLY_CONSUMED] },
        ...purchaseOrdersBase,
      },
    }),
    prisma.invoice.count({
      where: {
        deletedAt: null,
        status: InvoiceStatus.DERIVED_TO_AP,
        ...(actor.role === "REQUESTER_AREA"
          ? { OR: [{ areaAssigned: actor.area }, { purchaseOrder: { area: actor.area } }] }
          : actor.role === "PROCUREMENT"
            ? { id: "__no_results__" }
            : {}),
      },
    }),
    prisma.auditLog.findMany({
      where: {
        action: { in: ["REJECTED", "RETURNED"] },
      },
      include: { performedBy: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    pendingPurchaseOrders,
    pendingInvoices,
    purchaseOrdersWithBalance,
    invoicesForAccounting,
    recentRejections,
  };
}
