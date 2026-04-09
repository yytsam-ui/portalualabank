import { prisma } from "@/lib/prisma";

export const invoicesRepository = {
  list() {
    return prisma.invoice.findMany({
      where: { deletedAt: null },
      include: {
        supplier: true,
        purchaseOrder: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
  detail(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchaseOrder: {
          include: {
            supplier: true,
            items: true,
          },
        },
        allocations: {
          include: {
            purchaseOrderItem: true,
          },
        },
      },
    });
  },
};
