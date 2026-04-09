import { InvoiceStatus } from "@prisma/client";

import { assertCondition } from "@/lib/errors";

export function assertInvoiceIsNotDuplicate(duplicateExists: boolean) {
  assertCondition(!duplicateExists, "Ya existe una factura con ese proveedor, tipo y número.", "DUPLICATE_INVOICE");
}

export function assertInvoiceWithinPoBalance(invoiceTotalAmount: number, poRemainingAmount: number) {
  assertCondition(
    invoiceTotalAmount <= poRemainingAmount,
    `La factura supera el saldo disponible de la OC. Saldo disponible: ${poRemainingAmount.toFixed(2)}.`,
    "PO_BALANCE_EXCEEDED",
  );
}

export function assertInvoiceEditableStatus(status: InvoiceStatus) {
  assertCondition(status !== "ACCOUNTED", "La factura no puede editarse una vez contabilizada.", "INVOICE_NOT_EDITABLE");
}
