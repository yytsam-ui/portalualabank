import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { getCurrentSession } from "@/lib/auth";

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

export async function requireRoles(roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/403");
  }

  return user;
}
