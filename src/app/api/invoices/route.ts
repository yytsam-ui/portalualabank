import { NextResponse } from "next/server";

import { createInvoiceSchema } from "@/features/invoices/schemas";
import { createInvoice } from "@/features/invoices/invoices.service";
import { getCurrentSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const payload = createInvoiceSchema.parse(JSON.parse(String(formData.get("payload"))));
    const files = formData.getAll("attachments").filter((value): value is File => value instanceof File);
    const invoice = await createInvoice(session.user, payload, files);

    return NextResponse.json({ id: invoice.id });
  } catch (error) {
    return handleRouteError(error);
  }
}
