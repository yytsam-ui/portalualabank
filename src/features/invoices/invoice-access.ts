import { Prisma } from "@prisma/client";

import { assertCondition } from "@/lib/errors";
import { type SessionActor } from "@/lib/permissions";

export function assertCanCreateInvoice(actor: SessionActor) {
  assertCondition(actor.role === "REQUESTER_AREA", "Solo el area puede cargar facturas.", "FORBIDDEN", 403);
}

export function assertCanSendInvoiceToAp(actor: SessionActor) {
  assertCondition(actor.role === "REQUESTER_AREA", "Solo el area puede enviar facturas a AP.", "FORBIDDEN", 403);
}

export function assertCanCreateMonitorInvoice(actor: SessionActor) {
  assertCondition(actor.role === "AP", "Solo AP puede cargar facturas en el monitor.", "FORBIDDEN", 403);
}

export function assertCanAssignMonitorInvoice(actor: SessionActor) {
  assertCondition(actor.role === "AP", "Solo AP puede derivar facturas a un area.", "FORBIDDEN", 403);
}

export function assertCanApOperateInvoice(actor: SessionActor) {
  assertCondition(actor.role === "AP", "Solo AP puede operar facturas derivadas.", "FORBIDDEN", 403);
}

export function buildInvoiceListWhere(actor: SessionActor): Prisma.InvoiceWhereInput {
  if (actor.role === "ADMIN") {
    return { deletedAt: null };
  }

  if (actor.role === "REQUESTER_AREA") {
    return {
      deletedAt: null,
      OR: [
        { areaAssigned: actor.area },
        { purchaseOrder: { area: actor.area } },
      ],
    };
  }

  if (actor.role === "AP") {
    return {
      deletedAt: null,
      status: { in: ["DERIVED_TO_AP", "RETURNED_BY_AP", "ACCOUNTED"] },
    };
  }

  return { id: "__forbidden__", deletedAt: null };
}

export function canApSeeInvoiceStatus(status: string) {
  return ["DRAFT", "PENDING_AREA_APPROVAL", "DERIVED_TO_AP", "RETURNED_BY_AP", "ACCOUNTED"].includes(status);
}
