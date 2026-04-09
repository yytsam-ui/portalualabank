import { InvoiceStatus, PurchaseOrderStatus } from "@prisma/client";

import { assertCondition } from "@/lib/errors";

const editablePurchaseOrderStatuses: PurchaseOrderStatus[] = ["DRAFT"];
const eligibleInvoicePoStatuses: PurchaseOrderStatus[] = ["APPROVED", "PARTIALLY_CONSUMED"];

export function assertPurchaseOrderEditable(status: PurchaseOrderStatus) {
  assertCondition(
    editablePurchaseOrderStatuses.includes(status),
    "La orden de compra no puede editarse en el estado actual.",
    "PO_NOT_EDITABLE",
  );
}

export function assertPurchaseOrderEligibleForInvoice(status: PurchaseOrderStatus) {
  assertCondition(
    eligibleInvoicePoStatuses.includes(status),
    "Solo se pueden asociar facturas a OCs aprobadas o parcialmente consumidas.",
    "PO_NOT_ELIGIBLE",
  );
}

export function assertPurchaseOrderSubmittable(status: PurchaseOrderStatus) {
  assertCondition(status === "DRAFT", "Solo se pueden aprobar OCs en borrador.", "INVALID_PO_TRANSITION");
}

export function assertPurchaseOrderDecisionable(status: PurchaseOrderStatus) {
  assertCondition(status === "DRAFT", "La OC no esta disponible para aprobacion.", "INVALID_PO_TRANSITION");
}

export function assertInvoiceEditable(status: InvoiceStatus) {
  assertCondition(status !== "ACCOUNTED", "La factura no puede editarse una vez contabilizada.", "INVOICE_NOT_EDITABLE");
}

export function assertInvoiceAreaDecisionable(status: InvoiceStatus) {
  assertCondition(
    status === "PENDING_AREA_APPROVAL" || status === "RETURNED_BY_AP",
    "La factura no esta pendiente de gestion del area.",
    "INVALID_INVOICE_TRANSITION",
  );
}

export function assertInvoiceApProcessable(status: InvoiceStatus) {
  assertCondition(status === "DERIVED_TO_AP", "La factura no esta derivada a AP.", "INVALID_INVOICE_TRANSITION");
}
