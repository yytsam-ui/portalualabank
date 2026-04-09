import { NextResponse } from "next/server";

import { createMonitorInvoiceSchema } from "@/features/invoices/schemas";
import { createMonitorInvoice } from "@/features/invoices/invoices.service";
import { getCurrentSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const payload = createMonitorInvoiceSchema.parse(JSON.parse(String(formData.get("payload"))));
    const files = formData.getAll("attachments").filter((value): value is File => value instanceof File);
    const invoice = await createMonitorInvoice(session.user, payload, files);

    return NextResponse.json({ id: invoice.id });
  } catch (error) {
    return handleRouteError(error);
  }
}
