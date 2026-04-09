import { NextResponse } from "next/server";

import { returnInvoiceByAp } from "@/features/invoices/invoices.service";
import { getCurrentSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { z } from "zod";

const schema = z.object({
  decision: z.enum(["RETURNED"]),
  comment: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { comment } = schema.parse(await request.json());
    const { id } = await params;
    await returnInvoiceByAp(session.user, id, comment || "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
