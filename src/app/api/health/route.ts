import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "portal-uala-bank",
    timestamp: new Date().toISOString(),
  });
}
