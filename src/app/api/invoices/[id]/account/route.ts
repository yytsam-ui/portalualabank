import { NextResponse } from "next/server";

import { accountInvoiceSchema } from "@/features/invoices/schemas";
import { accountInvoice } from "@/features/invoices/invoices.service";
import { getCurrentSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const payload = accountInvoiceSchema.parse(await request.json());
    const { id } = await params;
    await accountInvoice(session.user, id, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
