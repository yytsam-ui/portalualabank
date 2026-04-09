import { NextResponse } from "next/server";

import { createPurchaseOrderSchema } from "@/features/purchase-orders/schemas";
import { createPurchaseOrder } from "@/features/purchase-orders/purchase-orders.service";
import { getCurrentSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const payload = createPurchaseOrderSchema.parse(JSON.parse(String(formData.get("payload"))));
    const files = formData.getAll("attachments").filter((value): value is File => value instanceof File);

    const purchaseOrder = await createPurchaseOrder(session.user, payload, files);

    return NextResponse.json({ id: purchaseOrder.id });
  } catch (error) {
    return handleRouteError(error);
  }
}
