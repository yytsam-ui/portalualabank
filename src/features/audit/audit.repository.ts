import { prisma } from "@/lib/prisma";

export const auditRepository = {
  list(filters?: {
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
  },
};
