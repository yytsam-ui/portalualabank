import { AuditAction, EntityType, Prisma } from "@prisma/client";

type AuditTx = Prisma.TransactionClient | typeof import("@/lib/prisma").prisma;

export async function createAuditLog(
  tx: AuditTx,
  input: {
    entityType: EntityType;
    entityId: string;
    action: AuditAction;
    performedById: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    comment?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return tx.auditLog.create({
    data: input,
  });
}
