import fs from "node:fs/promises";

import { NextResponse } from "next/server";

import { getAttachmentDetail } from "@/features/attachments/attachments.service";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const attachment = await getAttachmentDetail(session.user, id);

  const file = await fs.readFile(attachment.filePath);
  const download = new URL(request.url).searchParams.get("descarga") === "1";
  return new NextResponse(file, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${attachment.fileName}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
