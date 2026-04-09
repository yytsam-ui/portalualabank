import { NextResponse } from "next/server";

import { createSupplierSchema } from "@/features/suppliers/schemas";
import { createSupplier } from "@/features/suppliers/suppliers.service";
import { getCurrentSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const payload = createSupplierSchema.parse(await request.json());
    const supplier = await createSupplier(session.user, payload);

    return NextResponse.json({ id: supplier.id });
  } catch (error) {
    return handleRouteError(error);
  }
}
