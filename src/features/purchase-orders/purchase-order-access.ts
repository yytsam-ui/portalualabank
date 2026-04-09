import { Prisma } from "@prisma/client";

import { assertCondition } from "@/lib/errors";
import { type SessionActor } from "@/lib/permissions";

export function assertCanCreatePurchaseOrder(actor: SessionActor) {
  assertCondition(actor.role === "PROCUREMENT", "Solo Compras puede crear OCs.", "FORBIDDEN", 403);
}

export function assertCanApprovePurchaseOrder(actor: SessionActor) {
  assertCondition(actor.role === "PROCUREMENT", "Solo Compras puede aprobar OCs.", "FORBIDDEN", 403);
}

export function buildPurchaseOrderListWhere(actor: SessionActor): Prisma.PurchaseOrderWhereInput {
  if (actor.role === "ADMIN") {
    return { deletedAt: null };
  }

  if (actor.role === "PROCUREMENT" || actor.role === "REQUESTER_AREA") {
    return { deletedAt: null, area: actor.area };
  }

  return { id: "__forbidden__", deletedAt: null };
}
