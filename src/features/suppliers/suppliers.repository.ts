import { prisma } from "@/lib/prisma";

export const suppliersRepository = {
  list(search?: string) {
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
  },
  create(data: { businessName: string; taxId: string; email: string; active: boolean }) {
    return prisma.supplier.create({ data });
  },
};
