import { prisma } from "@/lib/prisma";

export const purchaseOrdersRepository = {
  list() {
    return prisma.purchaseOrder.findMany({
      where: { deletedAt: null },
      include: {
        supplier: true,
        createdBy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
  detail(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: true,
        approvedBy: true,
        items: true,
        invoices: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },
  nextSequence() {
    return prisma.purchaseOrder.count({ where: { deletedAt: null } });
  },
};
