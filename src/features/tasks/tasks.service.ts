import { InvoiceStatus, PurchaseOrderStatus } from "@prisma/client";

import { type SessionActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function getTaskInbox(actor: SessionActor) {
  const tasks: Array<{
    id: string;
    title: string;
    entityType: "PURCHASE_ORDER" | "INVOICE";
    entityId: string;
    status: string;
    area: string;
    createdAt: Date;
    href: string;
  }> = [];

  if (actor.role === "PROCUREMENT") {
    const poTasks = await prisma.purchaseOrder.findMany({
      where: {
        deletedAt: null,
        status: PurchaseOrderStatus.DRAFT,
        area: actor.area,
      },
      orderBy: { createdAt: "desc" },
    });
    tasks.push(
      ...poTasks.map((po) => ({
        id: `po-${po.id}`,
        title: `Aprobar OC ${po.number}`,
        entityType: "PURCHASE_ORDER" as const,
        entityId: po.id,
        status: po.status,
        area: po.area,
        createdAt: po.createdAt,
        href: `/purchase-orders/${po.id}`,
      })),
    );
  }

  if (actor.role === "REQUESTER_AREA") {
    const invoiceTasks = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        status: { in: [InvoiceStatus.PENDING_AREA_APPROVAL, InvoiceStatus.RETURNED_BY_AP] },
        areaAssigned: actor.area,
      },
      include: { purchaseOrder: true },
      orderBy: { createdAt: "desc" },
    });

    tasks.push(
      ...invoiceTasks.map((invoice) => ({
        id: `invoice-${invoice.id}`,
        title: `Enviar factura ${invoice.invoiceNumber || "sin numero"} a AP`,
        entityType: "INVOICE" as const,
        entityId: invoice.id,
        status: invoice.status,
        area: invoice.areaAssigned || invoice.purchaseOrder?.area || actor.area,
        createdAt: invoice.createdAt,
        href: `/invoices/${invoice.id}`,
      })),
    );
  }

  if (actor.role === "AP") {
    const apTasks = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        status: InvoiceStatus.DERIVED_TO_AP,
      },
      include: { purchaseOrder: true },
      orderBy: { createdAt: "desc" },
    });

    tasks.push(
      ...apTasks.map((invoice) => ({
        id: `ap-${invoice.id}`,
        title: `Procesar factura ${invoice.invoiceNumber}`,
        entityType: "INVOICE" as const,
        entityId: invoice.id,
        status: invoice.status,
        area: invoice.purchaseOrder?.area || invoice.areaAssigned || "-",
        createdAt: invoice.createdAt,
        href: `/invoices/${invoice.id}`,
      })),
    );
  }

  if (actor.role === "ADMIN") {
    const [draftPoTasks, derivedInvoices] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { deletedAt: null, status: PurchaseOrderStatus.DRAFT },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.invoice.findMany({
        where: { deletedAt: null, status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.PENDING_AREA_APPROVAL, InvoiceStatus.DERIVED_TO_AP] } },
        include: { purchaseOrder: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    tasks.push(
      ...draftPoTasks.map((po) => ({
        id: `admin-po-${po.id}`,
        title: `Seguimiento OC ${po.number}`,
        entityType: "PURCHASE_ORDER" as const,
        entityId: po.id,
        status: po.status,
        area: po.area,
        createdAt: po.createdAt,
        href: `/purchase-orders/${po.id}`,
      })),
      ...derivedInvoices.map((invoice) => ({
        id: `admin-invoice-${invoice.id}`,
        title: `Seguimiento factura ${invoice.invoiceNumber}`,
        entityType: "INVOICE" as const,
        entityId: invoice.id,
        status: invoice.status,
        area: invoice.purchaseOrder?.area || invoice.areaAssigned || "-",
        createdAt: invoice.createdAt,
        href: `/invoices/${invoice.id}`,
      })),
    );
  }

  return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
