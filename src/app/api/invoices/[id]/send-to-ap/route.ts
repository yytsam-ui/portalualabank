import { NextResponse } from "next/server";

import { areaSendInvoiceSchema } from "@/features/invoices/schemas";
import { sendInvoiceToAp } from "@/features/invoices/invoices.service";
import { getCurrentSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const payload = areaSendInvoiceSchema.parse(JSON.parse(String(formData.get("payload"))));
    const files = formData.getAll("attachments").filter((value): value is File => value instanceof File);
    const { id } = await params;

    await sendInvoiceToAp(session.user, id, payload, files);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
