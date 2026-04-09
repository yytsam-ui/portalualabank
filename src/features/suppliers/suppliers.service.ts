import { AuditAction, EntityType } from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { type SessionActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertCanCreateSupplier } from "@/features/suppliers/supplier-access";

export async function createSupplier(
  actor: SessionActor,
  input: { businessName: string; taxId: string; email: string; active: boolean },
) {
  assertCanCreateSupplier(actor);

  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: input,
    });

    await createAuditLog(tx, {
      entityType: EntityType.SUPPLIER,
      entityId: supplier.id,
      action: AuditAction.CREATED,
      performedById: actor.id,
      comment: "Proveedor creado por Compras.",
      metadata: { businessName: supplier.businessName, taxId: supplier.taxId },
    });

    return supplier;
  });
}

export async function listSuppliers(search?: string) {
  return prisma.supplier.findMany({
    where: search
      ? {
          OR: [
            { businessName: { contains: search, mode: "insensitive" } },
            { taxId: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { businessName: "asc" },
  });
}
