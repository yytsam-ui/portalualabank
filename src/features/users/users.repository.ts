import { prisma } from "@/lib/prisma";

export const usersRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
};
