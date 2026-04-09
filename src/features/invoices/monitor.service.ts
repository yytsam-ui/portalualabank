import { InvoiceSourceType, InvoiceStatus } from "@prisma/client";

import { assertCanCreateMonitorInvoice } from "@/features/invoices/invoice-access";
import { prisma } from "@/lib/prisma";
import { formatStatusLabel } from "@/lib/utils";
import { type SessionActor } from "@/lib/permissions";

export type ApMonitorFilters = {
  q?: string;
  status?: string;
  supplierId?: string;
  area?: string;
  purchaseOrderId?: string;
  currency?: string;
  accountCode?: string;
  costCenter?: string;
  createdById?: string;
  sourceType?: string;
  hasAttachment?: string;
  invoiceType?: string;
  dateFrom?: string;
  dateTo?: string;
  receivedFrom?: string;
  receivedTo?: string;
  page?: string;
};

export type ApMonitorRow = {
  id: string;
  internalId: string;
  invoiceNumber: string;
  supplierName: string;
  supplierTaxId: string;
  invoiceType: string;
  invoiceDate: Date | null;
  receivedDate: Date;
  currency: string;
  subtotal: string;
  taxes: string;
  total: string;
  areaAssigned: string;
  areaOrigin: string;
  purchaseOrderNumber: string;
  accountCode: string;
  costCenter: string;
  status: string;
  statusLabel: string;
  sourceType: string;
  sourceLabel: string;
  createdByName: string;
  derivedByName: string;
  approvedByName: string;
  accountedByName: string;
  createdAt: Date;
  updatedAt: Date;
  derivedAt: Date | null;
  sentToApAt: Date | null;
  accountedAt: Date | null;
  hasAttachment: boolean;
  notes: string;
  returnReason: string;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

export function filterApMonitorRows(rows: ApMonitorRow[], filters: ApMonitorFilters) {
  return rows.filter((row) => {
    const matchesGlobal =
      !filters.q ||
      [
        row.internalId,
        row.invoiceNumber,
        row.supplierName,
        row.supplierTaxId,
        row.purchaseOrderNumber,
        row.areaAssigned,
        row.areaOrigin,
        row.accountCode,
        row.costCenter,
        row.statusLabel,
        row.sourceLabel,
        row.notes,
        row.returnReason,
        row.createdByName,
        row.derivedByName,
        row.approvedByName,
        row.accountedByName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(filters.q.toLowerCase());

    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999Z`) : null;
    const receivedFrom = filters.receivedFrom ? new Date(filters.receivedFrom) : null;
    const receivedTo = filters.receivedTo ? new Date(`${filters.receivedTo}T23:59:59.999Z`) : null;

    return (
      matchesGlobal &&
      (!filters.status || row.status === filters.status) &&
      (!filters.supplierId || row.supplierName === filters.supplierId) &&
      (!filters.area || row.areaAssigned === filters.area || row.areaOrigin === filters.area) &&
      (!filters.purchaseOrderId || row.purchaseOrderNumber === filters.purchaseOrderId) &&
      (!filters.currency || row.currency === filters.currency) &&
      (!filters.accountCode || normalizeText(row.accountCode).includes(filters.accountCode.toLowerCase())) &&
      (!filters.costCenter || normalizeText(row.costCenter).includes(filters.costCenter.toLowerCase())) &&
      (!filters.createdById || row.createdByName === filters.createdById) &&
      (!filters.sourceType || row.sourceType === filters.sourceType) &&
      (!filters.hasAttachment || (filters.hasAttachment === "si" ? row.hasAttachment : !row.hasAttachment)) &&
      (!filters.invoiceType || row.invoiceType === filters.invoiceType) &&
      (!dateFrom || row.createdAt >= dateFrom) &&
      (!dateTo || row.createdAt <= dateTo) &&
      (!receivedFrom || row.receivedDate >= receivedFrom) &&
      (!receivedTo || row.receivedDate <= receivedTo)
    );
  });
}

export async function getApMonitorData(actor: SessionActor, filters: ApMonitorFilters) {
  assertCanCreateMonitorInvoice(actor);

  const invoices = await prisma.invoice.findMany({
    where: {
      deletedAt: null,
      sourceType: InvoiceSourceType.AP_MONITOR,
    },
    include: {
      supplier: true,
      purchaseOrder: true,
      uploadedBy: true,
      approvedByUserArea: true,
      accountedBy: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const invoiceIds = invoices.map((invoice) => invoice.id);

  const [attachments, approvals, auditLogs] = await Promise.all([
    prisma.attachment.findMany({
      where: {
        entityType: "INVOICE",
        entityId: { in: invoiceIds },
      },
      select: { entityId: true },
    }),
    prisma.approval.findMany({
      where: {
        entityType: "INVOICE",
        entityId: { in: invoiceIds },
      },
      include: { decidedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: {
        entityType: "INVOICE",
        entityId: { in: invoiceIds },
      },
      include: { performedBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows: ApMonitorRow[] = invoices.map((invoice) => {
    const invoiceAttachments = attachments.filter((attachment) => attachment.entityId === invoice.id);
    const invoiceApprovals = approvals.filter((approval) => approval.entityId === invoice.id);
    const invoiceAuditLogs = auditLogs.filter((log) => log.entityId === invoice.id);
    const derivedToArea = invoiceAuditLogs.find((log) => log.action === "DERIVED" && log.toStatus === "PENDING_AREA_APPROVAL");
    const sentToAp = invoiceAuditLogs.find((log) => log.action === "DERIVED" && log.toStatus === "DERIVED_TO_AP");
    const returnedByAp = invoiceAuditLogs.find((log) => log.action === "RETURNED");

    return {
      id: invoice.id,
      internalId: invoice.id.slice(0, 8),
      invoiceNumber: invoice.invoiceNumber || "Pendiente",
      supplierName: invoice.supplier.businessName,
      supplierTaxId: invoice.supplier.taxId,
      invoiceType: invoice.invoiceType || "-",
      invoiceDate: invoice.invoiceDate,
      receivedDate: invoice.receivedDate,
      currency: invoice.currency || "-",
      subtotal: invoice.subtotal?.toString() || "-",
      taxes: invoice.taxes?.toString() || "-",
      total: invoice.totalAmount?.toString() || "-",
      areaAssigned: invoice.areaAssigned || "-",
      areaOrigin: invoice.purchaseOrder?.area || "-",
      purchaseOrderNumber: invoice.purchaseOrder?.number || "-",
      accountCode: invoice.accountCode || invoice.purchaseOrder?.accountCode || "-",
      costCenter: invoice.costCenter || invoice.purchaseOrder?.costCenter || "-",
      status: invoice.status,
      statusLabel: formatStatusLabel(invoice.status),
      sourceType: invoice.sourceType,
      sourceLabel: invoice.sourceType === "AP_MONITOR" ? "Monitor AP" : "Carga desde area",
      createdByName: invoice.uploadedBy.name,
      derivedByName: derivedToArea?.performedBy.name || sentToAp?.performedBy.name || "-",
      approvedByName: invoice.approvedByUserArea?.name || invoiceApprovals.find((approval) => approval.decision === "APPROVED")?.decidedBy.name || "-",
      accountedByName: invoice.accountedBy?.name || "-",
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      derivedAt: derivedToArea?.createdAt || null,
      sentToApAt: sentToAp?.createdAt || null,
      accountedAt: invoice.accountedAt,
      hasAttachment: invoiceAttachments.length > 0,
      notes: invoice.notes || "-",
      returnReason: returnedByAp?.comment || "-",
    };
  });

  const filteredRows = filterApMonitorRows(rows, filters);
  const page = Math.max(1, Number(filters.page || 1));
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    rows: paginatedRows,
    total: filteredRows.length,
    page: safePage,
    totalPages,
  };
}

export async function getApMonitorFilterOptions() {
  const [suppliers, purchaseOrders, users, areas] = await Promise.all([
    prisma.supplier.findMany({ where: { active: true }, orderBy: { businessName: "asc" } }),
    prisma.purchaseOrder.findMany({ where: { deletedAt: null }, orderBy: { number: "asc" }, select: { number: true } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { active: true, role: "REQUESTER_AREA" },
      select: { area: true },
      distinct: ["area"],
      orderBy: { area: "asc" },
    }),
  ]);

  return {
    suppliers,
    purchaseOrders,
    users,
    areas: areas.map((item) => item.area),
    statuses: ["DRAFT", "PENDING_AREA_APPROVAL", "DERIVED_TO_AP", "RETURNED_BY_AP", "ACCOUNTED", "CANCELED"] as InvoiceStatus[],
    sourceTypes: ["AP_MONITOR", "AREA"] as InvoiceSourceType[],
    currencies: ["ARS", "USD"],
    invoiceTypes: ["A", "B", "C", "CREDIT_NOTE", "DEBIT_NOTE"],
  };
}
