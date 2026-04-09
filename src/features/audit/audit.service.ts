import { prisma } from "@/lib/prisma";

export async function listAuditLogs(filters?: {
  entityType?: string;
  action?: string;
  performedById?: string;
}) {
  return prisma.auditLog.findMany({
    where: {
      entityType: filters?.entityType as never,
      action: filters?.action as never,
      performedById: filters?.performedById,
    },
    include: {
      performedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
