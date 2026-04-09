import { Role } from "@prisma/client";

import { DomainError } from "@/lib/errors";

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  PROCUREMENT: "Compras",
  REQUESTER_AREA: "Area Solicitante",
  AP: "Pago a Proveedores",
};

export type SessionActor = {
  id: string;
  role: Role;
  area: string;
  name?: string | null;
  email?: string | null;
};

export function assertRole(actor: SessionActor, allowed: Role[]) {
  if (!allowed.includes(actor.role)) {
    throw new DomainError("No tenes permisos para ejecutar esta accion.", "FORBIDDEN", 403);
  }
}

export function canReadArea(actor: SessionActor, area: string) {
  if (actor.role === "ADMIN") {
    return true;
  }

  if (actor.role === "PROCUREMENT" || actor.role === "REQUESTER_AREA") {
    return actor.area === area;
  }

  return false;
}

export function canManageSupplier(actor: SessionActor) {
  return actor.role === "ADMIN" || actor.role === "PROCUREMENT";
}

export function canManagePurchaseOrder(actor: SessionActor) {
  return actor.role === "ADMIN" || actor.role === "PROCUREMENT";
}

export function canManageAreaInvoices(actor: SessionActor, area: string) {
  return actor.role === "ADMIN" || (actor.role === "REQUESTER_AREA" && actor.area === area);
}

export function canAccessAp(actor: SessionActor) {
  return actor.role === "ADMIN" || actor.role === "AP";
}
