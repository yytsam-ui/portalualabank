import { assertCondition } from "@/lib/errors";
import { type SessionActor } from "@/lib/permissions";

export function assertCanCreateSupplier(actor: SessionActor) {
  assertCondition(actor.role === "PROCUREMENT", "Solo Compras puede crear proveedores.", "FORBIDDEN", 403);
}
