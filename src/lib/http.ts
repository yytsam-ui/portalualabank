import { NextResponse } from "next/server";

import { DomainError } from "@/lib/errors";

export function handleRouteError(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
}
